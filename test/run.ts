import { describe, it } from 'mocha';
import { expect, use, request } from 'chai';
import chaiHttp from 'chai-http';
import fs from 'fs';
import path from 'path';

if (fs.existsSync('data/data.db'))
    fs.unlinkSync('data/data.db');
if (fs.existsSync('data/database-backup.db'))
    fs.unlinkSync('data/database-backup.db');
use(chaiHttp);
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

getAllFiles('test').forEach(f => {
    if (f.endsWith('.jpg'))
        fs.unlinkSync(f);
});

//TODO check settings file
const oldSettings: Buffer|undefined = fs.existsSync('settings.json') ? fs.readFileSync('settings.json') : undefined

describe('File Tests', () => {
    it('Node_modules installed', () => {
        expect(fs.existsSync('build/node_modules')).to.be.true;
    });

    it('Database files has been created', () => {
        expect(fs.existsSync('build/data/data.db')).to.be.true;
        expect(fs.existsSync('build/data/database-backup.db')).to.be.true;
    });

    fs.writeFileSync('settings.json', JSON.stringify({
        'Video Directory': './test/videos',
        'debug': false,
        'sync': true,
        'disableUpdate': true,
        'httpPort': 3000,
        'httpsPort': 3001
    }, null, 4));
});

const app = require('../build/index.js');
const argv = app.argv
describe('Test requests', () => {
    const requester = request(`http://localhost:${argv.httpPort}/api/`).keepOpen();
    let token: string;
    before(async () => {
        //Wait for images
        await new Promise<void>((resolve, reject) => {
            app.appEvents.on('finished', data => {
                console.log(data)
                if (data === 'image generation')
                    resolve()
            })
        })


        const data = await requester.post('login/').set('Content-Type', 'application/json').send({ Username: 'Admin', Passwort: 'pass' });
        expect(data.status).to.equal(200);
        expect(data.text).to.have.lengthOf(20);
        expect(data.text).to.match(/[ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789]{20}/);
        token = data.text;
    });

    it('Add user', async () => {
        return requester.put('addUser/').set('Content-Type', 'application/json').send({ token: token, username: 'Testi', password: 'pass', perm: 'User' })
            .then(data => {
                return [expect(data.status).to.be.equal(200)];
            });
    });

    describe('Get files', () => {
        let testFile;
        before(async () => {
            const data = await requester.get('getFiles/').query({ token: token, path: '', type: '' }).send();
            expect(data.status).to.be.equal(200);
            expect(data.body.files).to.have.lengthOf(3);
            testFile = data.body.files[2].Path;
        });
        
        it('Subfolder', async () => {
            return requester.get('getFiles/').query({ token: token, path: testFile }).send()
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.files).to.have.lengthOf(2)];
                });
        });

        it('WatchList', async () => {
            return requester.get('getFiles/').query({ token: token, path: '', type: 'Watchlist' }).send()
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.files).to.have.lengthOf(0)];
                });
        });
    });

    describe('Sorttypes', () => {
        it('Get sort type', async () => {
            return requester.get('getSortTypes/').query({ token: token }).send()
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body).to.have.lengthOf(3)];
                });
        });
    });

    describe('Watchlist', () => {
        it('Add to Watchlist', async () => {
            return requester.put('addWatchList/').set('Content-Type', 'application/json').send({ token: token, path: '1.mp4' })
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.text).to.equal('added')];
                });
        });

        it('Check watchlist', async () => {
            return requester.get('getFiles/').query({ token: token, path: '' }).send()
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.files.find(a => a.name === '1').watchList).to.be.true];
                });
        });

        it('Remove from watchlist', async () => {
            return requester.delete('removeWatchList/').set('Content-Type', 'application/json').send({ token: token, path: '1.mp4' })
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.text).to.equal('removed')];
                });
        });

        it('Check watchlist', async () => {
            return requester.get('getFiles/').query({ token: token, path: '' }).send()
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.files.find(a => a.name === '1').watchList).to.be.false];
                });
        });
    });

    describe('Manipulate accounts', () => {
        let accounts;

        before(async () => {
            const data = await requester.get('getUsers/').query({ token: token }).send();
            expect(data.status).to.be.equal(200);
            expect(data.body).to.have.lengthOf(2);
            accounts = data.body;
        });

        it('Change active', async () => {
            return requester.post('changeActive/').set('Content-Type', 'application/json').send({ token: token, state: false, uuid: accounts.find(a => a.username === 'Testi').UUID })
                .then(data => {
                    return [expect(data.status).to.be.equal(200)];
                });
        });

        it('Check changed active state', async () => {
            return await requester.get('getUsers/').query({ token: token }).send()
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.find(a => a.username === 'Testi').active).to.equal(0)];
                });
        });      
        
        it('Change password', async () => {
            return await requester.post('changePass/').set('Content-Type', 'application/json').send({ token: token, newPass: 't', oldPass: 'pass' })
                .then(data => {
                    return [expect(data.status).to.be.equal(200)];
                });
        });

        it('Check changed password', async () => {
            return await requester.get('getUsers/').query({ token: token }).send()
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.find(a => a.username === 'Admin').password).to.have.lengthOf(1)];
                });
        }); 

        it('logout', async () => {
            return await requester.post('logout/').set('Content-Type', 'application/json').send({ token: token })
                .then(data => {
                    return [expect(data.status).to.be.equal(200)];
                });
        });

        after(async () => {
            const data = await requester.post('login/').set('Content-Type', 'application/json').send({ Username: 'Admin', Passwort: 't' });
            expect(data.status).to.equal(200);
            expect(data.text).to.have.lengthOf(20);
            expect(data.text).to.match(/[ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789]{20}/);
            token = data.text;
        });
    });

    describe('Delete Token', () => {
        before(async () => {
            const acc = await requester.get('getUsers/').query({ token: token }).send();
            expect(acc.status).to.be.equal(200);
            expect(acc.body).to.have.lengthOf(2);
            const data = await requester.delete('deleteToken/').set('Content-Type', 'application/json').send({ token: token, uuid: acc.body.find(a => a.username === 'Admin').UUID });
            expect(data.status).to.be.equal(200);
        });

        it('Check token', async () => {
            return await requester.post('checkToken/').set('Content-Type', 'application/json').send({ token: token })
                .then(data => {
                    return [expect(data.status).to.be.equal(404)];
                });
        });

        after(async () => {
            const data = await requester.post('login/').set('Content-Type', 'application/json').send({ Username: 'Admin', Passwort: 't' });
            expect(data.status).to.equal(200);
            expect(data.text).to.have.lengthOf(20);
            expect(data.text).to.match(/[ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789]{20}/);
            token = data.text;
        });
    });

    describe('Filedata', () => {
        it('1.mp4', async () => {
            return await requester.get('FileData/').query({ token: token, path: '1.mp4' }).send()
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.skip.startTime).to.equal(-1),
                        expect(data.body.skip.stopTime).to.equal(-1), expect(data.body.pathSep).to.equal(path.sep),
                        expect(data.body.current).to.equal(path.sep + '1.mp4'), expect(data.body.next).to.equal('2.webm')
                    ];
                });
        });

        it('subFolder' + path.sep + '3.webm', async () => {
            return await requester.get('FileData/').query({ token: token, path: 'subFolder' + path.sep + '3.webm' }).send()
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.skip.startTime).to.equal(-1),
                        expect(data.body.skip.stopTime).to.equal(-1), expect(data.body.pathSep).to.equal(path.sep),
                        expect(data.body.current).to.equal(path.sep + 'subFolder' + path.sep + '3.webm'),
                        expect(data.body.next).to.equal(path.sep + 'subFolder' + path.sep + '4.mp4')
                    ];
                });
        });

        it('Set time', async () => {
            return await requester.put('setTime/').set('Content-Type', 'application/json').send({ token: token, path: '1.mp4', percent: 0.67 })
                .then(data => {
                    return [expect(data.status).to.be.equal(200)];
                });
        });

        it('Check time', async () => {
            return await requester.get('getTime/').query({ token: token, path: '1.mp4' }).send()
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.text).to.equal('0.67')];
                });
        });

        it('Invalid time', async () => {
            return (await requester.put('setTime/').set('Content-Type', 'application/json').send({ token: token, path: '1.mp4', percent: -1 })
                .then(data => {
                    return [expect(data.status).to.be.equal(400), expect(data.text).to.be.equal('The request payload is invalid:\nName: percent => Invalid')];
                })).concat(await requester.put('setTime/').set('Content-Type', 'application/json').send({ token: token, path: '1.mp4', percent: 2 })
                .then(data => {
                    return [expect(data.status).to.be.equal(400), expect(data.text).to.be.equal('The request payload is invalid:\nName: percent => Invalid')];
                }));
        });

        it('Set stars', async () => {
            return await requester.put('setStars/').set('Content-Type', 'application/json').send({ token: token, path: '1.mp4', stars: 4 })
                .then(data => {
                    return [expect(data.status).to.be.equal(200)];
                });
        });

        it('Check stars', async () => {
            return await requester.get('getStars/').query({ token: token, path: '1.mp4' }).send()
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.text).to.equal('4')];
                });
        });

        it('Invalid stars', async () => {
            return (await requester.put('setStars/').set('Content-Type', 'application/json').send({ token: token, path: '1.mp4', stars: -1 })
                .then(data => {
                    return [expect(data.status).to.be.equal(400), expect(data.text).to.be.equal('The request payload is invalid:\nName: stars => Invalid')];
                })).concat(await requester.put('setStars/').set('Content-Type', 'application/json').send({ token: token, path: '1.mp4', stars: 6 })
                .then(data => {
                    return [expect(data.status).to.be.equal(400), expect(data.text).to.be.equal('The request payload is invalid:\nName: stars => Invalid')];
                })).concat(await requester.put('setStars/').set('Content-Type', 'application/json').send({ token: token, path: '1.mp4', stars: 4.31 })
                .then(data => {
                    return [expect(data.status).to.be.equal(400), expect(data.text).to.be.equal('The request payload is invalid:\nName: stars => Invalid')];
                }));
        });
    });

    describe('Userdata', async () => {
        it('Check user data', async () => {
            return await requester.get('getUserData/').query({ token: token }).send()
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.volume).to.equal(30)];
                });
        });

        it('Max volume', async () => {
            return await requester.put('setUserData/').set('Content-Type', 'application/json').send({ token: token, data: { volume: 100 } })
                .then(data => {
                    return [expect(data.status).to.be.equal(200)];
                });
        });

        it('Check user data', async () => {
            return await requester.get('getUserData/').query({ token: token }).send()
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.volume).to.equal(100)];
                });
        });

        describe('Invalid user data', () => {
            it('No volume', async () => {
                return await requester.put('setUserData/').set('Content-Type', 'application/json').send({ token: token, data: {  } })
                    .then(data => {
                        return [expect(data.status).to.be.equal(400), expect(data.text).to.be.equal('Malformatted data')];
                    });
            });
    
            it('To much volume', async () => {
                return await requester.put('setUserData/').set('Content-Type', 'application/json').send({ token: token, data: { volume: 101 } })
                    .then(data => {
                        return [expect(data.status).to.be.equal(400), expect(data.text).to.be.equal('Malformatted data')];
                    });
            });
    
            it('Not enough volume', async () => {
                return await requester.put('setUserData/').set('Content-Type', 'application/json').send({ token: token, data: { volume: -1 } })
                    .then(data => {
                        return [expect(data.status).to.be.equal(400), expect(data.text).to.be.equal('Malformatted data')];
                    });
            });
        });
    });

    after(() => {
        if (oldSettings)
            fs.writeFileSync('settings.json', oldSettings)
    })
});


function getAllFiles(check : string) : string[] {
    let files = [];
    if (fs.existsSync(check) && fs.statSync(check).isDirectory()) {
        for (const testPath of fs.readdirSync(check)) {
            const stats = fs.statSync(path.join(check, testPath));
            if (stats.isDirectory()) {
                files = files.concat(getAllFiles(path.join(check, testPath)));
            } else
                files.push(path.join(check, testPath));
        }
    }
    return files;
}