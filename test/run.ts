import { describe, it } from "mocha";
import { expect, use, request } from "chai";
import chaiHttp from "chai-http";
import fs from "fs"

if (fs.existsSync("data/data.db"))
    fs.unlinkSync("data/data.db")
if (fs.existsSync("data/database-backup.db"))
    fs.unlinkSync("data/database-backup.db")
use(chaiHttp)
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

//TODO check settings file

import { argv } from "../index"

describe("File Tests", () => {
    it("Node_modules installed", () => {
        expect(fs.existsSync("node_modules")).to.be.true
    })

    it("Database files has been created", () => {
        expect(fs.existsSync("data/data.db")).to.be.true
        expect(fs.existsSync("data/database-backup.db")).to.be.true
    })

    it("Temp folder has been created", () => {
        expect(fs.existsSync("temp")).to.be.true
    })
})


describe("Test requests", () => {
    const requester = request(`http://localhost:${argv.httpPort}/api/`).keepOpen()
    let token
    before(async () => {
        let data = await requester.post('login/').set('Content-Type', 'application/json').send({ Username: 'Admin', Passwort: 'pass' })
        expect(data.status).to.equal(200)
        expect(data.body["status"]).to.be.true
        expect(data.body["data"]).to.have.lengthOf(20)
        expect(data.body["data"]).to.match(/[ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789]{20}/)
        token = data.body["data"]
    })

    it("Add user", async () => {
        return requester.put('addUser/').set('Content-Type', 'application/json').send({ token: token, username: 'Testi', password: 'pass', perm: 'User' })
            .then(data => {
                return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.true]
            })
    })

    describe("Get files", () => {
        let testFile;
        before(async () => {
            let data = await requester.get('getFiles/').query({ token: token, path: '' }).send()
            expect(data.status).to.be.equal(200)
            expect(data.body.status).to.be.true
            expect(data.body.data.files).to.have.lengthOf(3)
            testFile = data.body.data.files[2].Path
        })
        
        it("Subfolder", async () => {
            return requester.get('getFiles/').query({ token: token, path: testFile }).send()
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.true, expect(data.body.data.files).to.have.lengthOf(2)]
                })
        })

        it("WatchList", async () => {
            return requester.get('getFiles/').query({ token: token, path: '', type: 'Watchlist' }).send()
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.true, expect(data.body.data.files).to.have.lengthOf(0)]
                })
        })
    })

    describe("Sorttypes", () => {
        it("Get sort type", async () => {
            return requester.get('getSortTypes/').query({ token: token }).send()
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.true, expect(data.body.data).to.have.lengthOf(3)]
                })
        })
    })

    describe("Watchlist", () => {
        it("Add to Watchlist", async () => {
            return requester.put('addWatchList/').set('Content-Type', 'application/json').send({ token: token, path: '1.mp4' })
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.true, expect(data.body.data).to.equal("added")]
                })
        })

        it("Check watchlist", async () => {
            return requester.get('getFiles/').query({ token: token, path: '' }).send()
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.true, expect(data.body.data.files.find(a => a.name === "1").watchList).to.be.true]
                })
        })

        it("Remove from watchlist", async () => {
            return requester.delete('removeWatchList/').set('Content-Type', 'application/json').send({ token: token, path: '1.mp4' })
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.true, expect(data.body.data).to.equal("removed")]
                })
        })

        it("Check watchlist", async () => {
            return requester.get('getFiles/').query({ token: token, path: '' }).send()
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.true, expect(data.body.data.files.find(a => a.name === "1").watchList).to.be.false]
                })
        })
    })

    describe("Manipulate accounts", () => {
        let accounts;

        before(async () => {
            let data = await requester.get('getUsers/').query({ token: token }).send()
            expect(data.status).to.be.equal(200)
            expect(data.body.status).to.be.true
            expect(data.body.data).to.have.lengthOf(2)
            accounts = data.body.data
        })

        it("Change active", async () => {
            return requester.post('changeActive/').set('Content-Type', 'application/json').send({ token: token, state: false, uuid: accounts.find(a => a.username === "Testi").UUID })
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.true]
                })
        })

        it("Check changes active state", async () => {
            return await requester.get('getUsers/').query({ token: token }).send()
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.true, expect(data.body.data.find(a => a.username === "Testi").active).to.equal('false')]
                })
        })      
        
        it("Change password", async () => {
            return await requester.post('changePass/').set('Content-Type', 'application/json').send({ token: token, newPass: 't', oldPass: 'pass' })
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.true]
                })
        })

        it("Check changed password", async () => {
            return await requester.get('getUsers/').query({ token: token }).send()
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.true, expect(data.body.data.find(a => a.username === "Admin").password).to.have.lengthOf(1)]
                })
        }) 

        it("logout", async () => {
            return await requester.post('logout/').set('Content-Type', 'application/json').send({ token: token })
                .then(data => {
                    return [expect(data.status).to.be.equal(200), expect(data.body.status).to.be.true]
                })
        })

        after(async () => {
            let data = await requester.post('login/').set('Content-Type', 'application/json').send({ Username: 'Admin', Passwort: 't' })
            expect(data.status).to.equal(200)
            expect(data.body["status"]).to.be.true
            expect(data.body["data"]).to.have.lengthOf(20)
            expect(data.body["data"]).to.match(/[ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789]{20}/)
            token = data.body["data"]
        })
    })

    describe("delete Token", () => {
        before(async () => {

        })

        after(async () => {

        })
    })

})