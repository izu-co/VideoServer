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

describe('File Tests', () => {
    it('Node_modules installed', () => {
        expect(fs.existsSync('build/node_modules')).to.be.true;
    });

    it('Database files has been created', () => {
        expect(fs.existsSync('build/data/data.db')).to.be.true;
        expect(fs.existsSync('build/data/database-backup.db')).to.be.true;
    });

    it('Temp folder has been created', () => {
        expect(fs.existsSync('build/temp')).to.be.true;
    });

    fs.writeFileSync('settings.json', JSON.stringify({
        "Video Directory": "./test/videos",
        "debug": false,
        "sync": true,
        "disableUpdate": true,
        "httpPort": 3000,
        "httpsPort": 3001
    }, null, 4))
});

const argv = require('../build/index.js').argv

describe('Test requests', () => {
    const requester = request(`http://localhost:${argv.httpPort}/api/`).keepOpen();
    let token;
    before(async () => {
        const data = await requester.post('login/').set('Content-Type', 'application/json').send({ Username: 'Admin', Passwort: 'pass' });
        expect(data.status).to.equal(200);
        expect(data.body['status']).to.be.true;
        expect(data.body['data']).to.have.lengthOf(20);
        expect(data.body['data']).to.match(/[ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789]{20}/);
        token = data.body['data'];
    });

    it('Add user', async () => {
        return requester.put('addUser/').set('Content-Type', 'application/json').send({ token: token, username: 'Testi', password: 'pass', perm: 'User' })
            .then(data => {
                return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.true];
            });
    });

    describe('Get files', () => {
        let testFile;
        before(async () => {
            const data = await requester.get('getFiles/').query({ token: token, path: '' }).send();
            expect(data.status).to.be.equal(200);
            expect(data.body.status).to.be.true;
            expect(data.body.data.files).to.have.lengthOf(3);
            testFile = data.body.data.files[2].Path;
        });
        
        it('Subfolder', async () => {
            return requester.get('getFiles/').query({ token: token, path: testFile }).send()
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.true, expect(data.body.data.files).to.have.lengthOf(2)];
                });
        });

        it('WatchList', async () => {
            return requester.get('getFiles/').query({ token: token, path: '', type: 'Watchlist' }).send()
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.true, expect(data.body.data.files).to.have.lengthOf(0)];
                });
        });
    });

    describe('Sorttypes', () => {
        it('Get sort type', async () => {
            return requester.get('getSortTypes/').query({ token: token }).send()
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.true, expect(data.body.data).to.have.lengthOf(3)];
                });
        });
    });

    describe('Watchlist', () => {
        it('Add to Watchlist', async () => {
            return requester.put('addWatchList/').set('Content-Type', 'application/json').send({ token: token, path: '1.mp4' })
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.true, expect(data.body.data).to.equal('added')];
                });
        });

        it('Check watchlist', async () => {
            return requester.get('getFiles/').query({ token: token, path: '' }).send()
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.true, expect(data.body.data.files.find(a => a.name === '1').watchList).to.be.true];
                });
        });

        it('Remove from watchlist', async () => {
            return requester.delete('removeWatchList/').set('Content-Type', 'application/json').send({ token: token, path: '1.mp4' })
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.true, expect(data.body.data).to.equal('removed')];
                });
        });

        it('Check watchlist', async () => {
            return requester.get('getFiles/').query({ token: token, path: '' }).send()
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.true, expect(data.body.data.files.find(a => a.name === '1').watchList).to.be.false];
                });
        });
    });

    describe('Manipulate accounts', () => {
        let accounts;

        before(async () => {
            const data = await requester.get('getUsers/').query({ token: token }).send();
            expect(data.status).to.be.equal(200);
            expect(data.body.status).to.be.true;
            expect(data.body.data).to.have.lengthOf(2);
            accounts = data.body.data;
        });

        it('Change active', async () => {
            return requester.post('changeActive/').set('Content-Type', 'application/json').send({ token: token, state: false, uuid: accounts.find(a => a.username === 'Testi').UUID })
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.true];
                });
        });

        it('Check changed active state', async () => {
            return await requester.get('getUsers/').query({ token: token }).send()
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.true, expect(data.body.data.find(a => a.username === 'Testi').active).to.equal('false')];
                });
        });      
        
        it('Change password', async () => {
            return await requester.post('changePass/').set('Content-Type', 'application/json').send({ token: token, newPass: 't', oldPass: 'pass' })
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.true];
                });
        });

        it('Check changed password', async () => {
            return await requester.get('getUsers/').query({ token: token }).send()
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.true, expect(data.body.data.find(a => a.username === 'Admin').password).to.have.lengthOf(1)];
                });
        }); 

        it('logout', async () => {
            return await requester.post('logout/').set('Content-Type', 'application/json').send({ token: token })
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.true];
                });
        });

        after(async () => {
            const data = await requester.post('login/').set('Content-Type', 'application/json').send({ Username: 'Admin', Passwort: 't' });
            expect(data.status).to.equal(200);
            expect(data.body['status']).to.be.true;
            expect(data.body['data']).to.have.lengthOf(20);
            expect(data.body['data']).to.match(/[ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789]{20}/);
            token = data.body['data'];
        });
    });

    describe('Delete Token', () => {
        before(async () => {
            const acc = await requester.get('getUsers/').query({ token: token }).send();
            expect(acc.status).to.be.equal(200);
            expect(acc.body.status).to.be.true;
            expect(acc.body.data).to.have.lengthOf(2);
            const data = await requester.delete('deleteToken/').set('Content-Type', 'application/json').send({ token: token, uuid: acc.body.data.find(a => a.username === 'Admin').UUID });
            expect(data.status).to.be.equal(200);
            expect(data.body.status).to.be.true;
        });

        it('Check token', async () => {
            return await requester.post('checkToken/').set('Content-Type', 'application/json').send({ token: token })
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.false, expect(data.body.reason).to.equal('User not Found')];
                });
        });

        after(async () => {
            const data = await requester.post('login/').set('Content-Type', 'application/json').send({ Username: 'Admin', Passwort: 't' });
            expect(data.status).to.equal(200);
            expect(data.body['status']).to.be.true;
            expect(data.body['data']).to.have.lengthOf(20);
            expect(data.body['data']).to.match(/[ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789]{20}/);
            token = data.body['data'];
        });
    });

    describe('Filedata', () => {
        it('1.mp4', async () => {
            return await requester.get('FileData/').query({ token: token, path: '1.mp4' }).send()
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.true, expect(data.body.data.skip.startTime).to.equal(-1),
                        expect(data.body.data.skip.stopTime).to.equal(-1), expect(data.body.data.pathSep).to.equal(path.sep),
                        expect(data.body.data.current).to.equal(path.sep + '1.mp4'), expect(data.body.data.next).to.equal('2.webm')
                    ];
                });
        });

        it('subFolder' + path.sep + '3.webm', async () => {
            return await requester.get('FileData/').query({ token: token, path: 'subFolder' + path.sep + '3.webm' }).send()
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.true, expect(data.body.data.skip.startTime).to.equal(-1),
                        expect(data.body.data.skip.stopTime).to.equal(-1), expect(data.body.data.pathSep).to.equal(path.sep),
                        expect(data.body.data.current).to.equal(path.sep + 'subFolder' + path.sep + '3.webm'),
                        expect(data.body.data.next).to.equal(path.sep + 'subFolder' + path.sep + '4.mp4')
                    ];
                });
        });

        it('Set time', async () => {
            return await requester.put('setTime/').set('Content-Type', 'application/json').send({ token: token, path: '1.mp4', percent: 0.67 })
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.true];
                });
        });

        it('Check time', async () => {
            return await requester.get('getTime/').query({ token: token, path: '1.mp4' }).send()
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.true, expect(data.body.data).to.equal(0.67)];
                });
        });

        it('Invalid time', async () => {
            return (await requester.put('setTime/').set('Content-Type', 'application/json').send({ token: token, path: '1.mp4', percent: -1 })
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.false];
                })).concat(await requester.put('setTime/').set('Content-Type', 'application/json').send({ token: token, path: '1.mp4', percent: 2 })
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.false];
                }));
        });

        it('Set stars', async () => {
            return await requester.put('setStars/').set('Content-Type', 'application/json').send({ token: token, path: '1.mp4', stars: 4 })
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.true];
                });
        });

        it('Check stars', async () => {
            return await requester.get('getStars/').query({ token: token, path: '1.mp4' }).send()
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.true, expect(data.body.data).to.equal(4)];
                });
        });

        it('Invalid stars', async () => {
            return (await requester.put('setStars/').set('Content-Type', 'application/json').send({ token: token, path: '1.mp4', stars: -1 })
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.false];
                })).concat(await requester.put('setStars/').set('Content-Type', 'application/json').send({ token: token, path: '1.mp4', stars: 6 })
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.false];
                })).concat(await requester.put('setStars/').set('Content-Type', 'application/json').send({ token: token, path: '1.mp4', stars: 4.31 })
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.false];
                }));
        });
    });

    describe('Userdata', async () => {
        it('Check user data', async () => {
            return await requester.get('getUserData/').query({ token: token }).send()
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.true, expect(data.body.data.volume).to.equal(30)];
                });
        });

        it('Max volume', async () => {
            return await requester.put('setUserData/').set('Content-Type', 'application/json').send({ token: token, data: { volume: 100 } })
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.true];
                });
        });

        it('Check user data', async () => {
            return await requester.get('getUserData/').query({ token: token }).send()
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.true, expect(data.body.data.volume).to.equal(100)];
                });
        });

        describe('Invalid user data', () => {
            it('No volume', async () => {
                return await requester.put('setUserData/').set('Content-Type', 'application/json').send({ token: token, data: {  } })
                    .then(data => {
                        return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.false];
                    });
            });
    
            it('To much volume', async () => {
                return await requester.put('setUserData/').set('Content-Type', 'application/json').send({ token: token, data: { volume: 101 } })
                    .then(data => {
                        return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.false];
                    });
            });
    
            it('Not enough volume', async () => {
                return await requester.put('setUserData/').set('Content-Type', 'application/json').send({ token: token, data: { volume: 101 } })
                    .then(data => {
                        return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.false];
                    });
            });
        });
    });
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