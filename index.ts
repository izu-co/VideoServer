import {
    argv
} from './yargs';
import {
    FileSettings,
    Updater
} from './backend/updater';

const updater = new Updater('anappleforlife', 'videoplayer', new Map < string, FileSettings > ()
    .set('data', FileSettings.DontOverride), argv.beta
);

if (!argv.debug && !argv.disableUpdate)
    updater.checkForUpdates();

import express from 'express';
import * as fs from 'fs';
import path from 'path';

if (!fs.existsSync('temp'))
    fs.mkdirSync('temp');


function clearCacheRecur(p: string) {
    const stats = fs.lstatSync(p);
    if (stats.isDirectory()) {
        const files = fs.readdirSync(p);
        if (files.length === 0 && p !== path.join(__dirname, 'temp'))
            fs.rmdirSync(p);
        files.forEach(f => clearCacheRecur(path.join(p,f)));
    } else {
        if (stats.mtime.getTime() + 30 * 60 * 1000 < new Date().getTime()) {
            fs.unlinkSync(p);
        }
    }
}

function clearCache() {
    clearCacheRecur(path.join(__dirname, 'temp'));
    setTimeout(() => {
        clearCache();
    }, 1000 * 60 * 30);
}

clearCache();

const app = express();

if (!fs.existsSync(argv['Video Directory'])) {
    console.log('[ERROR] Please provide a valid video directory path.');
    process.exit(1);
}

const VideoNameExtensions = ['mp4', 'webm'];

export {
    argv,
    app,
    VideoNameExtensions
};

import {
    db,
    backup,
    fileIndex
} from './backend/database';

export {
    db,
    fileIndex
};

backupCacheRegular();

function backupCacheRegular() {
    backup();
    setTimeout(() => {
        backupCacheRegular();
    }, 1000 * 60 * 10);
}

import router from './routes/index';
import {
    init
} from './routes/ExpressUses';
import * as fileStuff from './backend/fileStuff';
import * as loginBackend from './backend/UserMangement';
import {
    Server
} from 'socket.io';
import http from 'http';
import https from 'https';

if (!argv.debug)
    fileStuff.createImages(argv['Video Directory'], false, false, argv.sync);

let options;

if (fs.existsSync(path.join(__dirname, 'SSL', 'server.key')) && fs.existsSync(path.join(__dirname, 'SSL', 'server.crt'))) {
    options = {
        key: fs.readFileSync(path.join(__dirname, 'SSL', 'server.key'), 'utf-8').toString(),
        cert: fs.readFileSync(path.join(__dirname, 'SSL', 'server.crt'), 'utf8').toString(),
    };
}

const httpsEnabled: boolean = options ? true : false;

let httpsServer: https.Server | undefined;
const httpServer = http.createServer(app);


if (httpsEnabled) {
    app.use((req, res, next) => {
        if (!req.secure) {
            return res.redirect(308, 'https://' + req.headers.host.split(':')[0] + (argv.httpsPort !== 443 ? ':' + argv.httpsPort : '') + req.url);
        }
        next();
    });
    httpsServer = options ? https.createServer(options, app) : https.createServer(app);
}

const socketIO = httpsEnabled ? new Server(httpsServer, {}) : new Server(httpServer, {});

export {
    socketIO
};

init();
app.use('/', router);


httpServer.listen(argv.httpPort, () => {
    console.log(`[INFO] Listening on http://localhost${argv.httpPort !== 80 ? ':' + argv.httpPort : ''}/`);
    httpServer.emit('started');
});

if (httpsServer) {
    httpsServer.listen(argv.httpsPort, () => {
        console.log(`[INFO] Listening on https://localhost${argv.httpsPort !== 443 ? ':' + argv.httpsPort : ''}/`);
        httpsServer.emit('started');
    });
}

export {
    httpsEnabled, httpServer, httpsServer
};

function checkCookies() {
    loginBackend.checkTokenForValid();
    setTimeout(() => {
        checkCookies();
    }, (1000 * 60));
}

checkCookies();

if (!argv.shutup)
    console.log('[INFO] If you like the programm, please star the github repo :)');