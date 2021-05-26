const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs');

const argv = yargs
    .option('test', {
        boolean: true,
        default: false,
        describe: 'If set to true, the programm will build a test env'
    }).argv;

const buildOptions = {
    ignore: [
        'test',
        'temp',
        'data',
        '*.ts',
        '*.log',
        '.github',
        '.git',
        'build',
        'update.zip',
        'tsconfig.json',
        'webpack.config.js',
        '.eslintrc.json'
    ]
};

if (!argv.test) {
    buildOptions.ignore.push(
        'SSL' + path.sep + 'server.crt',
        'SSL' + path.sep + 'server.key',
        'node_modules',
    )
}

deleteDir('build');
const tsc = child_process.exec('tsc -p tsconfig.json');

tsc.on('close', (code) => console.log(`[Typescript] Finished with code ${code}`));
tsc.on('error', (err) => console.log(`[Typescript] ${err}`));
tsc.on('message', (msg) => console.log(`[Typescript] ${msg}`));

tsc.on('close', () => {
    const webpack = child_process.exec('npx webpack');
    webpack.on('close', (code) => console.log(`[Webpack] Finished with code ${code}`));
    webpack.on('error', (err) => console.log(`[Webpack] ${err}`));
    webpack.on('message', (msg) => console.log(`[Webpack] ${msg}`));

    webpack.on('close', () => {
        let copy = getAllFiles('.').filter(a => {
            return buildOptions.ignore.every(ign => {
                if (ign.match(/\*\.[A-Za-z]/)) {
                    if (path.extname(a) === ign.substring(1))
                        return false;
                } else {
                    if (path.resolve(a).startsWith(path.resolve(ign))) 
                        return false;
                }
                return true;
            }) && fs.lstatSync(a).isFile();
        });
        
        copy.forEach(c => {
            createParents(path.join('build', c).split(path.sep).slice(0, -1).join(path.sep));
            fs.copyFile(c, path.join('build', c), (err) => {
                if (err) {
                    console.log(err);    
                    console.log('❌', c); 
                    process.exit(1);
                }
            });
        });
        
        console.log('Copyed files');
    });
});

function getAllFiles(p) {
    let files = [];
    if (!fs.existsSync(p))
        return files;
    if (fs.statSync(p).isDirectory()) {
        for (let f of fs.readdirSync(p)) {
            let stats = fs.statSync(path.join(p, f));
            if (stats.isDirectory())
                files = files.concat(getAllFiles(path.join(p, f))); 
            else
                files.push(path.join(p, f));
        }
    }
    files.push(p);

    return files;
}

function createParents(p) {
    p.split(path.sep).forEach((_, index, array) => {
        if (!fs.existsSync(array.slice(0, index+1).join(path.sep)))
            fs.mkdirSync(array.slice(0, index+1).join(path.sep));
    });
}

function deleteDir(p) {
    if (!fs.existsSync(p))
        return;
    if (fs.statSync(p).isDirectory()) {
        for (let f of fs.readdirSync(p)) {
            let stats = fs.statSync(path.join(p, f));
            if (stats.isDirectory())
                deleteDir(path.join(p, f));
            else
                fs.unlinkSync(path.join(p, f));
        }
        fs.rmdirSync(p);
    } else
        fs.unlinkSync(p);
}