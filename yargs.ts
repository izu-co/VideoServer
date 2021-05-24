import * as yargs from 'yargs';
import fs from 'fs';
import { ProgrammSettingsInterface } from './interfaces';
import path from 'path';

const argv = yargs  
    .option('Video Directory', {
        alias: 'vd',
        describe: 'The Directory Path were your videos are',
        requiresArg: true,
        string: true
    })
    .option('debug', {
        boolean: true,
        default: false,
        hidden: true
    })
    .option('Working Directory', {
        string: true,
        default: __dirname,
        hidden: true,
        describe: 'Dont change if you dont know what you are doing!\nYou can change the working directory if you need it.',
        alias: 'wd'
    })
    .option('beta', {
        boolean: true,
        default: false,
        describe: 'Set this to true if you want to download beta versions!'
    })
    .option('shutup', {
        boolean: true,
        default: false,
        describe: 'Don\'t want the star advert? Remove it with this flag!',
        alias: 's',
    })
    .option('httpPort', {
        number: true,
        default: 80,
        describe: 'The port to pind the http server to'
    })
    .option('httpsPort', {
        number: true,
        default: 443,
        describe: 'The port to pind the https server to'
    })
    .option('sync', {
        boolean: true,
        default: false,
        describe: 'Whether the images should be created before the server starts'
    })
    .option('disableUpdate', {
        boolean: true,
        default: false,
        describe: 'Wheather the server should check for updates'
    })
    .argv;
let data:ProgrammSettingsInterface;
if (fs.existsSync('settings.json')) 
    data = <ProgrammSettingsInterface> JSON.parse(fs.readFileSync('settings.json').toString());
if (!fs.existsSync('data'))
    fs.mkdirSync('data');

if (data !== undefined) {
    argv['Video Directory'] = (data['Video Directory'] !== undefined) ? path.resolve(data['Video Directory'].toString()) : false || argv['Video Directory'];
    argv['Working Directory'] = (data['Working Directory'] !== undefined) ? path.resolve(data['Working Directory'].toString()) : false || argv['Working Directory'];
    
    argv.sync = data.sync || argv.sync;
    argv.debug = data.debug || argv.debug;
    argv.disableUpdate = data.disableUpdate || argv.disableUpdate;

    argv.httpPort = 'httpPort' in data && Number.isInteger(data['httpPort']) ? parseInt(data['httpPort']) : argv.httpPort;
    argv.httpsPort = 'httpsPort' in data && Number.isInteger(data['httpsPort']) ? parseInt(data['httpsPort']) : argv.httpsPort;
}

export {argv};