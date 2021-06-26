import ffmpeg from 'fluent-ffmpeg';
import jimp from 'jimp';
import { BackendRequest } from '../interfaces.js';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { VideoNameExtensions, appEvents, argv } from '../index.js';
import { PassThrough } from 'stream';

/**
 * @param path The path to the video dir
 * @param override Sets the override behavior
 * @returns All files where an image has been created
 */
async function createImages(path:string, override:boolean, verbose = false, maxConcurrent = 25): Promise<BackendRequest<FileData[]>> {
    console.log('[INFO] Started Image generation');
    const paths = (await getAllFiles(path)).filter(file => VideoNameExtensions.includes(file.path.split('.').pop()) || file.stats.isDirectory());

    const createdImages = [];

    let folders = paths.filter(f => f.stats.isDirectory());
    let files = paths.filter(f => f.stats.isFile());

    let filesPromises = [];
    let folderPromises = [];

    const progress = {
        start: folders.length + files.length,
        finished: 0
    };

    const updateIntervall = setInterval(() => {
        console.log(`[INFO] ${progress.finished}/${progress.start} images created.`);
    }, 5000);

    while (files.length > 0) {
        for (let i = 0; i < Math.min(files.length, maxConcurrent); i++) {
            filesPromises.push(new Promise(async (resolve) => {
                const file = files[i];
                if (verbose)
                    console.log(`[INFO] Started ${file.path}`);
                const exists = await new Promise(resolve => {
                    fs.promises.access(file.path + '.jpg', fs.constants.F_OK)
                        .then(() => resolve(true))
                        .catch(() => resolve(false));
                });
                if (!exists || override) {
                    const ok = await generateImage(file.path);
                    if (ok && verbose)
                        console.log(`[INFO] Finished ${file.path}.jpg`);
                    else if (!ok)
                        console.log(`[ERROR] Unable to create image ${file.path}.jpg`);
                    if (ok)
                        createdImages.push(file);
                    progress.finished++;
                    return resolve(ok);
                } else {
                    progress.finished++;
                    return resolve(true);
                }
            }));
        }
        
        await Promise.all(filesPromises);
        filesPromises = [];
        files = files.slice(Math.min(files.length, maxConcurrent));
    }

    while (folders.length > 0) {
        for (let i = 0; i < Math.min(folders.length, maxConcurrent); i++) {
            folderPromises.push(new Promise(async (resolve) => {
                const file = folders[i];
                if (verbose)
                    console.log(`[INFO] Started ${file.path}`);
                const exists = await new Promise(resolve => {
                    fs.promises.access(file.path + '.jpg', fs.constants.F_OK)
                        .then(() => resolve(true))
                        .catch(() => resolve(false));
                });
                if (!exists || override) {
                    generateFolderImage(file.path).then(ok => {
                        if (ok && verbose)
                            console.log(`[INFO] Finished ${file.path}.jpg`);
                        else if (!ok)
                            console.log(`[ERROR] Unable to create image ${file.path}.jpg`);
                        if (ok)
                            createdImages.push(file);
                        progress.finished++;
                        return resolve(ok);
                    });
                } else {
                    progress.finished++;
                    return resolve(true);
                }
            }));
        }
        
        await Promise.all(folderPromises);
        folderPromises = [];
        folders = folders.slice(Math.min(folders.length, maxConcurrent));
    }
    console.log('[INFO] Image generation done');
    appEvents.emit('finished', 'image generation');
    clearInterval(updateIntervall);
    return {
        isOk: true,
        value: createdImages
    };
}

const generateFolderImage = async (path:string): Promise<boolean> => {
    const files = await getAllFiles(path);
    const filteredFiles = files.filter(a => {
        const split = a.path.split('.');
        return split.pop() === 'jpg' && VideoNameExtensions.includes(split.pop()) && a.stats.isFile();
    });
    switch (filteredFiles.length) {
    case 0:
        return true;
    case 1:
        await fs.promises.copyFile(filteredFiles[0].path, path + '.jpg');
        return true;
    case 2:
        await (await combine2(filteredFiles[0].path, filteredFiles[1].path)).writeAsync(path + '.jpg');
        return true;
    case 3:
        await (await combine3(filteredFiles[0].path, filteredFiles[1].path, filteredFiles[2].path)).writeAsync(path + '.jpg');
        return true;
    default:
        await (await combine4(...filteredFiles.map(a => a.path))).writeAsync(path + '.jpg');
        return true;
    }
};

const combine2 = async (file1: string, file2: string) : Promise<jimp> => {
    const one = await readImageFromFile(file1);
    const two = await readImageFromFile(file2);
    const final = await setQuality(await newImage(one.getWidth() + two.getWidth(), Math.max(one.getHeight(), two.getHeight())));
    for (let x = 0; x < one.getWidth(); x++)
        for (let y = 0; y < one.getHeight(); y++)
            final.setPixelColor(one.getPixelColor(x,y),x,y);
    for (let x = 0; x < two.getWidth(); x++)
        for (let y = 0; y < two.getHeight(); y++)
            final.setPixelColor(two.getPixelColor(x,y),x+one.getWidth(),y);
    return await scale(0.5, final);
};

const combine3 = async (file1: string, file2: string, file3: string) : Promise<jimp> => {
    const one = await readImageFromFile(file1);
    const two = await readImageFromFile(file2);
    let three = await readImageFromFile(file3);
    three = await resize(three, one.getWidth() + two.getWidth(), three.getHeight());
    const final =  await setQuality(await newImage(one.getWidth() + two.getWidth(), Math.max(one.getHeight(), two.getHeight()) + three.getHeight()));
    for (let x = 0; x < one.getWidth(); x++)
        for (let y = 0; y < one.getHeight(); y++)
            final.setPixelColor(one.getPixelColor(x,y),x,y);
    for (let x = 0; x < two.getWidth(); x++)
        for (let y = 0; y < two.getHeight(); y++)
            final.setPixelColor(two.getPixelColor(x,y),x+one.getWidth(),y);
    for (let x = 0; x < three.getWidth(); x++)
        for (let y = 0; y < three.getHeight(); y++)
            final.setPixelColor(three.getPixelColor(x,y),x,y+Math.max(one.getHeight(), two.getHeight()));
    return await scale(0.5, final);
};

const combine4 = async (...files: string[]) : Promise<jimp> => {
    if (files.length < 4)
        throw new Error('Invalid lenght');
    const indexes = getFour(files.length);
    const one = await readImageFromFile(files[indexes[0]]);
    const two = await readImageFromFile(files[indexes[1]]);
    const three = await readImageFromFile(files[indexes[2]]);
    const four = await readImageFromFile(files[indexes[3]]);
    const final =  await setQuality(await newImage(Math.max(one.getWidth() + two.getWidth(), three.getWidth() + four.getWidth()),
        Math.max(one.getHeight(), two.getHeight()) + Math.max(three.getHeight(), four.getHeight())));
    for (let x = 0; x < one.getWidth(); x++)
        for (let y = 0; y < one.getHeight(); y++)
            final.setPixelColor(one.getPixelColor(x,y),x,y);
    for (let x = 0; x < two.getWidth(); x++)
        for (let y = 0; y < two.getHeight(); y++)
            final.setPixelColor(two.getPixelColor(x,y),x+one.getWidth(),y);
    for (let x = 0; x < three.getWidth(); x++)
        for (let y = 0; y < three.getHeight(); y++)
            final.setPixelColor(three.getPixelColor(x,y),x,y+Math.max(one.getHeight(), two.getHeight()));
    for (let x = 0; x < four.getWidth(); x++)
        for (let y = 0; y < four.getHeight(); y++)
            final.setPixelColor(four.getPixelColor(x,y),x+three.getWidth(),y+Math.max(one.getHeight(), two.getHeight()));
    return await scale(0.5, final);
};

const getFour = (lenght: number) => {
    const indexes = [];
    do {
        let random = Math.floor(Math.random() * lenght);
        while (indexes.includes(random))
            random = Math.floor(Math.random() * lenght);
        indexes.push(random);
    } while(indexes.length < 4);
    return indexes;
};

const generateImage = async (path: string) : Promise<boolean> => {
    let last = 0.2;
    let lastImage: void|jimp;
    do {
        const img = await extractImage(path, last);
        if (!img) {
            if (!lastImage) 
                return false;
            
            await lastImage.writeAsync(path + '.jpg');
            return true;
        } else {
            if (!img.hasMore) {
                if (!lastImage) 
                    return false;
                await lastImage.writeAsync(path + '.jpg');
                return true;
            } else if (img.imageData.length > 0) {
                lastImage = await readImage(img.imageData);
                const setQual = await setQuality(lastImage, 5);
                if (setQual)
                    lastImage = setQual;
                let blackPixel = 0;
                let whitePixel = 0;
                const pixelAmount = (lastImage.getWidth() * lastImage.getHeight()) / 2;
                for (let x = 0; x < lastImage.getWidth() - 1; x+=2) {
                    for (let y = 0; y < lastImage.getHeight() - 2; y+=2) {
                        const rbg = jimp.intToRGBA(lastImage.getPixelColor(x, y));
                        if (rbg.b === 0 && rbg.g === 0 && rbg.r === 0)
                            blackPixel++;
                        else if (rbg.b === 255 && rbg.g === 255 && rbg.r === 255)
                            whitePixel++;
                    }
                }
                if ((blackPixel / pixelAmount) <= 0.8 && (whitePixel / pixelAmount) <= 0.8) {
                    await lastImage.writeAsync(path + '.jpg');
                    return true;
                }
            } else {
                if (!lastImage) 
                    return false;
                await lastImage.writeAsync(path + '.jpg');
                return true;
            }
        }


        last+=.05;
    } while (lastImage);
};

const extractImage = async (path: string, percent: number) : Promise<ImageAnswer> => {
    return new Promise<ImageAnswer>(async (resolve, reject) => {
        const data = await ffprobePromise(ffmpeg(path)).catch(er => console.log(er));
        if (!data) 
            return resolve();
        let hasMore = percent < 1;
        if (!data.format.duration || isNaN(data.format.duration)) {
            if (argv.debug)
                console.log('No lenght found', path);
            hasMore = false;
            data.format.duration = 5;
        }
        const time = percent * data.format.duration;
        const buffers = [];
        const passThrough = new PassThrough();
        passThrough.on('data', (chunk) => buffers.push(chunk));
        ffmpeg(path)
            .addOption('-frames:v 1')
            .format('mjpeg')
            .seekInput(time)
            .on('error', (er, stdout, stderr) => {
                if (er.message === 'Output stream closed' )
                    return;
                if (argv.debug)
                    console.log(er, stdout, stderr);
                reject(er);
            })
            .pipe(passThrough);
        passThrough.on('end', () => {
            const buffer = Buffer.concat(buffers);
            resolve({
                hasMore: hasMore,
                imageData: buffer
            });
        });
    });
};

type ImageAnswer = {
    hasMore: boolean,
    imageData: Buffer
} | void

const getAllFiles = async (curr:string) : Promise<FileData[]> => {
    const retFiles: FileData[] = [];

    const files = await readdir(curr);
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const stats = await stat(path.join(curr, file));
        if (stats.isDirectory()) {
            retFiles.push(...await getAllFiles(path.join(curr, file)));
        }
        retFiles.push({
            path: path.join(curr, file),
            stats: stats
        });
    }
    return retFiles;
};

type FileData = {
    path: string,
    stats: fs.Stats
}

const ffprobePromise = (command: ffmpeg.FfmpegCommand) => {
    return new Promise<ffmpeg.FfprobeData>((resolve, reject) => {
        command.ffprobe((er, data) => {
            if (er)
                return reject(er);
            resolve(data);
        });
    });
};

const setQuality = (img: jimp, quality = 5) => {
    return new Promise<jimp>((resolve, reject) => {
        img.quality(quality, (er, val) => {
            if (er)
                return reject(er);
            return resolve(val);
        });
    });
}; 

const newImage = async (w: number, h: number) : Promise<jimp> => {
    return new Promise<jimp>((resolve, reject) => {
        new jimp(w, h, (err, image) => {
            if (err)
                return reject(err);
            return resolve(image);
        });
    });
};

const scale = async (factor: number, img: jimp) : Promise<jimp> => {
    return new Promise<jimp>((resolve, reject) => {
        img.scale(factor, (er, val) => {
            if (er)
                return reject(er);
            return resolve(val);
        });
    });
};

const resize = (img: jimp, w: number, h:number) : Promise<jimp> => {
    return new Promise((resolve, reject) => {
        img.resize(w, h, (er, val) => {
            if (er)
                return reject(er);
            return resolve(val);
        });
    });
};

const readImage = (data: Buffer) => {
    return new Promise<jimp>((resolve, reject) => {
        jimp.read(data, (er, val) => {
            if (er)
                return reject(er);
            resolve(val);
        });
    });
};

const readImageFromFile = (data: string) => {
    return new Promise<jimp>((resolve, reject) => {
        jimp.read(data, (er, val) => {
            if (er)
                return reject(er);
            resolve(val);
        });
    });
};

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

export default createImages;