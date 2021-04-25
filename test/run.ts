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
        return requester.post('addUser/').set('Content-Type', 'application/json').send({ token: token, Passwort: 'pass' })
            .then(data => {
                console.log(data)
                return expect(data.status).to.be.equal(200)
            })
    })
})