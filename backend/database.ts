import * as fs from "fs"
import * as path from "path"
import * as sqlite from "better-sqlite3";
import {
	argv,
	VideoNameExtensions
} from "../index";
import {
	join
} from "path";
import * as chok from "chokidar";


let file = path.join(__dirname, "..", "data", "data.db")
let backupFile = path.join(__dirname, "..", "data", "database-backup.db")
let fileExists = fs.existsSync(file);
let existsBackup = fs.existsSync(backupFile)

let db = sqlite.default(file, {});
const fileIndex = sqlite.default(":memory:", {
	fileMustExist: false
})

fileIndex.exec("CREATE TABLE files (path TEXT PRIMARY KEY, created INT, isDir BOOLEAN)")

console.log("[INFO] Started indexing of files... This might take a minute.")

getAllFiles(argv["Video Directory"]).forEach(file => {
	fileIndex.prepare("INSERT INTO files VALUES(?,?,?)").run(file, fs.statSync(file).mtimeMs, fs.statSync(file).isDirectory() ? 1 : 0)
})

chok.watch(argv["Video Directory"], {
	alwaysStat: true,
	persistent: false,
	ignored: null,
	atomic: 100
}).on("add", (path, stats) => {
	if (path.substring(path.lastIndexOf(".") + 1) == "jpg" && fs.existsSync(path.substring(0, path.lastIndexOf(".")))) {
		if (fileIndex.prepare("SELECT * FROM files WHERE path=?").get(path.substring(0, path.lastIndexOf("."))) == null) {
			fileIndex.prepare("INSERT INTO files VALUES(?,?,?)").run(path.substring(0, path.lastIndexOf(".")), fs.lstatSync(path.substring(0, path.lastIndexOf("."))).mtimeMs, fs.lstatSync(path.substring(0, path.lastIndexOf("."))).isDirectory() ? 1 : 0)
		}
	} else {
		if (VideoNameExtensions.includes(path.substring(path.lastIndexOf(".") + 1)) &&
			fs.existsSync(path + ".jpg")) {
			if (fileIndex.prepare("SELECT * FROM files WHERE path=?").get(path) == null) {
				fileIndex.prepare("INSERT INTO files VALUES(?,?,?)").run(path, stats ? stats.mtimeMs : 0, 0)
			}
		}
	}
}).on("unlink", (path) => {
	if (path.substring(path.lastIndexOf(".") + 1) == "jpg") {
		if (fileIndex.prepare("SELECT * FROM files WHERE path=?").get(path.substring(0, path.lastIndexOf("."))) != null) {
			fileIndex.prepare("DELETE FROM files WHERE path=?").run(path.substring(0, path.lastIndexOf(".")))
		}
	} else {
		if (VideoNameExtensions.includes(path.substring(path.lastIndexOf(".") + 1))) {
			if (fileIndex.prepare("SELECT * FROM files WHERE path=?").get(path) != null) {
				fileIndex.prepare("DELETE FROM files WHERE path=?").run(path)
			}
		}
	}
}).on("addDir", (path, stats) => {
	if (fs.existsSync(path + ".jpg")) {
		if (fileIndex.prepare("SELECT * FROM files WHERE path=?").get(path) == null) {
			fileIndex.prepare("INSERT INTO files VALUES(?,?,?)").run(path, stats ? stats.mtimeMs : 0, 1)
		}
	}
}).on("unlinkDir", (path) => {
	if (fileIndex.prepare("SELECT * FROM files WHERE path=?").get(path) != null)
		fileIndex.prepare("DELETE FROM files WHERE path=?").run(path)
}).on("change", (path, stats) => {
	if (stats && fileIndex.prepare("SELECT * FROM files WHERE path=?").get(path) != null)
				fileIndex.prepare("UPDATE files SET created=? WHERE path=?").run(stats.mtimeMs, path)
})

console.log("[INFO] Finished indexing!")

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
		db.exec("CREATE TABLE IF NOT EXISTS stars (UUID TEXT, path TEXT, stars INT)")
		let prep = db.prepare("INSERT INTO settings VALUES (?, ?)")
		prep.run("default", 30)
		prep = db.prepare("INSERT INTO users VALUES (?, ?, ?, ?, ?)")
		prep.run("f084bdb1-7fb7-4e45-bace-e7719974e135", "Admin", "pass", "Admin", "true")
	}
}

function backup() {
	db.backup(path.join(__dirname, "..", "data", "database-backup.db"))
}

export {
	backup,
	db,
	fileIndex
}

function getAllFiles(path: string): Array < string > {
	let ret: Array < string > = [];

	let content: Array < string > = fs.readdirSync(path);
	content.forEach(subPath => {
		if (fs.lstatSync(join(path, subPath)).isDirectory()) {
			if (!fs.existsSync(join(path, subPath) + ".jpg"))
				return;
			getAllFiles(join(path, subPath)).forEach(a => ret.push(a));
			ret.push(join(path, subPath))
		} else {
			let fileNameExtenstion = join(path, subPath).substring(join(path, subPath).lastIndexOf(".") + 1);
			if (VideoNameExtensions.includes(fileNameExtenstion) && fs.existsSync(join(path, subPath) + ".jpg"))
				ret.push(join(path, subPath));
		}
	})

	return ret;
}