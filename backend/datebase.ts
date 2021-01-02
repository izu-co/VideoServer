import * as fs from "fs"
import * as path from "path"
import * as sqlite from "better-sqlite3";

let file = path.join(__dirname, "..", "data", "data.db")
let backupFile = path.join(__dirname, "..", "data", "database-backup.db")
let fileExists = fs.existsSync(file);
let existsBackup = fs.existsSync(backupFile)

let db = sqlite.default(file, {});

if (!fileExists) {
    if (existsBackup) {
        fs.copyFileSync(backupFile, file)
        db = sqlite.default(file)
    } else {
        db.exec("CREATE TABLE IF NOT EXISTS users (UUID TEXT PRIMARY KEY, username TEXT, password TEXT, perm TEXT, active BOOLEAN) WITHOUT ROWID")
        db.exec("CREATE TABLE IF NOT EXISTS status (UUID Text, path TEXT, data DOUBLE)")
        db.exec("CREATE TABLE IF NOT EXISTS intros (path TEXT PRIMARY KEY, startTime INT, endTime INT)")
        db.exec("CREATE TABLE IF NOT EXISTS settings (UUID TEXT PRIMARY KEY, volume INT)")
        db.exec("CREATE TABLE IF NOT EXISTS tokens (token TEXT PRIMARY KEY, UUID TEXT, created INTEGER, until INTEGER, ip TEXT)")
        db.exec("CREATE TABLE IF NOT EXISTS watchlist (UUID TEXT, path TEXT)")
        let prep = db.prepare("INSERT INTO settings VALUES (?, ?)")
        prep.run("default", 30)
        prep = db.prepare("INSERT INTO users VALUES (?, ?, ?, ?, ?)")
        prep.run("f084bdb1-7fb7-4e45-bace-e7719974e135", "Admin", "pass", "Admin", "true")
    }
}



function backup() {
    db.backup(path.join(__dirname, "..", "data", "database-backup.db"))
}

export {backup, db}