import { app, argv, VideoNameExtensions, socketIO } from '../index';
import * as express from 'express';
import * as path from 'path';
import { json } from 'body-parser';
import cookieParser from 'cookie-parser';
import { getUser, limiter } from './Routes';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import { checkPath } from '../backend/util';

const currentTranscoding = [];

export function init() : void {
    app.use(express.json());
    app.use(cookieParser());
    app.use(json());
    app.use('/', limiter);
    app.locals.streams = {};
    app.locals.converting = [];
    app.use((_, res, next) => {
        res.setHeader('Service-Worker-Allowed', '/');
        next();
    })
    app.use('/favicon.ico', express.static(path.join(argv['Working Directory'], 'icons', 'favicon.ico')));
    app.use('/icon', express.static(path.join(argv['Working Directory'], 'icons', 'Icon.png')));
    app.use('/manifest', express.static(path.join(argv['Working Directory'], 'pwa.webmanifest')));
    app.use('/icons', express.static(path.join(argv['Working Directory'], 'icons')));
    app.use('/fonts', express.static(path.join(argv['Working Directory'], 'fonts')));

    app.use('/', express.static(path.join(argv['Working Directory'], 'html')));
    app.use('/video', getUser(),  (req, res, next) => {
        if (!VideoNameExtensions.includes(req.url.split('.').pop())) return next();
        if (app.locals.streams[res.locals.user.username]) {
            app.locals.streams[res.locals.user.username]++;
        } else {
            app.locals.streams[res.locals.user.username] = 1;
        }
        req.on('close', () => {
            app.locals.streams[res.locals.user.username]--;
        });

        next();
    }, (req, res, next) => {
        if (!VideoNameExtensions.includes(req.url.split('.').pop())) return next();
        const urlPath = req.url.split('.');
        const pathCheck = checkPath(req.path.replace('/video/', ''));

        if (pathCheck.isOk === false) 
            return res.status(404).end();

        if (urlPath.pop() === 'mp4' && VideoNameExtensions.includes(urlPath.pop())) {
            if (fs.existsSync(decodePath(pathCheck.value)))
                return next();
            if (fs.existsSync('temp' + path.sep + decodePath(pathCheck.value.substring(argv['Video Directory'].length)))) {
                res.locals.tempVideo = 'temp' + path.sep + decodePath(pathCheck.value.substring(argv['Video Directory'].length));
                return next();
            }
        } else
            next();
    }, (_, res, next) => {
        if (!res.locals.tempVideo)
            return next();
        return res.sendFile(res.locals.tempVideo, {
            root: argv['Working Directory']
        });
    }, express.static(argv['Video Directory'], {
        dotfiles: 'allow'
    }));

    initSocket();
}

function initSocket() {
    socketIO.on('connection', (socket) => {
        socket.on('transcodeStatus', (pathToCheck, callback) => {
            const pathCheck = checkPath(pathToCheck);

            if (pathCheck.isOk === false) 
                return callback({
                    type: 'error'
                });

            let p = decodePath(pathCheck.value.substring(argv['Video Directory'].length));
            while (p.startsWith(path.sep))
                p = p.slice(1);
            if (fs.existsSync('temp' + path.sep + p)) 
                return callback({
                    type: 'ready'
                });
            
            if (currentTranscoding.includes(pathToCheck))
                return callback({
                    type: 'transcoding'
                });
            
            return callback({
                type: 'notFound'
            });
        });

        socket.on('startTranscoding', (pathToCheck) => {
            const pathCheck = checkPath(decodePath(pathToCheck));
            if (pathCheck.isOk === false) 
                return;
            if (currentTranscoding.includes(decodeURIComponent(pathCheck.value)))
                return;
            
            const streamPath = pathCheck.value.split('.').reverse().slice(1).reverse().join('.');

            pathCheck.value.substring(argv['Video Directory'].length).split(path.sep).forEach((_: string, i: number, a: Array<string>) => {
                if (i === 0)
                    return;
                const testPath = ['temp'].concat(a.slice(0, i)).join(path.sep);
                if (!fs.existsSync(testPath))
                    fs.mkdirSync(testPath);
            });
        
            ffmpeg()
                .input(streamPath)
                .outputOptions([ '-preset veryfast', '-vcodec libx264', '-threads 0', '-y'])
                .output('temp' + path.sep + decodePath(pathCheck.value.substring(argv['Video Directory'].length)))
                .on('end', () => {
                    const index = currentTranscoding.indexOf((pathCheck.value));
                    if (index > -1) {
                        currentTranscoding.splice(index, 1);
                    }
                    socketIO.emit(pathToCheck, {
                        type: 'finish'
                    });
                })
                .on('error', (err) => {
                    const index = currentTranscoding.indexOf(decodeURIComponent(pathCheck.value));
                    if (index > -1) {
                        currentTranscoding.splice(index, 1);
                    }
                    socketIO.emit(pathToCheck, {
                        type: 'error',
                        data: err.message
                    });
                })
                .on('start', () => {
                    currentTranscoding.push(decodeURIComponent(pathCheck.value));
                    socketIO.emit(pathToCheck, {
                        type: 'start'
                    });
                })
                .on('progress', (pro) => {
                    socketIO.emit(pathToCheck, {
                        type: 'progress',
                        data: pro.percent
                    });
                })
                .run();
        });
    });
}

function decodePath(path: string, escape = false ) {
    const ret = decodeURIComponent(path);
    if (escape)
        ret.replace(/\./g, '\\.');
    return ret;
}