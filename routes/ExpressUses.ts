import { app, argv, VideoNameExtensions, socketIO } from '../index';
import * as express from 'express';
import * as path from 'path';
import { json } from 'body-parser';
import cookieParser from 'cookie-parser';
import { getUser, limiter } from './Routes';
import ffmpeg from 'fluent-ffmpeg';
import { checkPath } from '../backend/util';
import { getUserFromToken } from '../backend/UserMangement';

export function init() : void {
    app.use(express.json());
    app.use(cookieParser());
    app.use(json());
    app.use('/', limiter);
    app.locals.streams = {};
    app.locals.converting = [];
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
            ffmpeg(decodePath(pathCheck.value).slice(0, -4))
                .ffprobe((er, data) => {
                    if (er)
                        return res.status(500).end('ffmpeg error');
                    const command = ffmpeg(decodePath(pathCheck.value).slice(0, -4))
                        .videoBitrate(data.format.bit_rate / 3)
                        .size('50%')
                        .videoCodec('libx264')
                        .format('mp4')
                        .outputOption('-movflags frag_keyframe+empty_moov')
                        .on('error', (er, stdout, stderr) => {
                            console.log(er, stdout, stderr);
                            return res.status(500).end('ffmpeg error');
                        })
                        .on('progress', (progress) => console.log(`[FFmpeg] ${progress.percent}`));
                    command
                        .pipe(res)
                        .on('error', (er) => {
                            if (er.message !== 'Output stream closed')
                                console.log(er);
                            return res.status(500).end(er.message);
                        });
                });
        } else
            next();
    }, express.static(argv['Video Directory'], {
        dotfiles: 'allow'
    }));

    initSocket();
}

function initSocket() {
    socketIO.on('connection', (socket) => {
        if (socket.handshake.auth.token) {
            const user = getUserFromToken(socket.handshake.auth.token, socket.handshake.address);
            if (user.isOk === false) {
                delete user.isOk;
                return socketIO.to(socket.id).emit('error', user, true);
            }
        } else {
            socketIO.to(socket.id).emit('error', 'No token provided', true);
            return;
        }

        socket.on('videoMetaData', (filepath, callback) => {
            const pathCheck = checkPath(filepath);

            if (pathCheck.isOk === false) 
                return callback({
                    type: 'error',
                    msg: pathCheck.message
                });

            let p = decodePath(pathCheck.value);
            while (p.startsWith(path.sep))
                p = p.slice(1);
            ffmpeg(p).ffprobe((er, data) => {
                if (er) {
                    console.log(er);
                    return callback({
                        type: 'error',
                        msg: er
                    });
                }
                return callback(data);
            });
        });
    });
}

function decodePath(path: string, escape = false ) {
    const ret = decodeURIComponent(path);
    if (escape)
        ret.replace(/\./g, '\\.');
    return ret;
}