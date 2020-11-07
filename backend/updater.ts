import * as fs from "fs"
import { resolve } from "path"
import { join } from "path"
import fetch from "node-fetch";
import unzipper from "unzipper";
import readline from "readline";
import progressStream from "progress-stream";
import req from "request";

interface Update {
    downloadURL: string,
    preRelease: boolean,
    size: number
}

interface File {
    path: string,
}

enum FileSettings {
    "Override", "DontOverride", "Ignore"
}


class Updater {

    constructor(private username:string, private repository:string, private fileSettings :Map<string, FileSettings>) {}

    checkForUpdates() {
        fs.readFile(join(__dirname, "../", "package.json"), (err, data) => {
            if (err)
                console.log("[ERROR]", err)
            let packageJSON = JSON.parse(data.toString())
            fetch(`https://api.github.com/repos/${this.username}/${this.repository}/releases/latest`)
            .then(data => data.json())
            .then(data => {
                if (data.tag_name > "v" + packageJSON.version) {
                    let rl = readline.createInterface({
                        input: process.stdin,
                        output: process.stdout
                    });
                    rl.question("An update is available. Do you like to update now? yes/[no] ", (answer) => {
                        rl.close()
                        if (answer === "yes" || answer === "y") {
                            this.downloadUpdate({
                                downloadURL: data.assets[0].browser_download_url,
                                preRelease: data.prerelease,
                                size: data.assets[0].size
                            })
                        } else {
                            return
                        }
                    })
                }
            })
            .catch(err => console.log("[ERROR]", err))
        })
    }

    downloadUpdate(update: Update, downloadPreRelase = false, overwrite= true) {       
        if (!downloadPreRelase && update.preRelease)
            return;
        if (!fs.existsSync("update.zip") || overwrite) {
            const file = fs.createWriteStream("update.zip");
            console.log("[INFO][Update] Downloading update...")
            let progress = progressStream({
                time: 1000,
                speed: 2,
                length: update.size
            }, function (progress) {
                console.log(`[INFO][Update] ${progress.transferred}/${progress.length} (${Math.round(progress.percentage)+'%'}, eta ${progress.eta}s)`)
            })
            req(update.downloadURL, {
                method: "GET",
                headers: {
                    "User-Agent": "github-updater"
                }
            }).pipe(progress)
            .pipe(file)
            file.on("close", () => {
                console.log("[INFO][Update] Update download done.")
                this.update({
                    path: file.path.toString(),
                }, this.fileSettings)
            })
        }
    }

    update(file : File, fileSettings = new Map<string, FileSettings>(), defaultSetting = FileSettings.Override) {
        let stream = fs.createReadStream(file.path, {})
        stream.on("ready", () => {
            console.log("[INFO][Update] Extracting")
            stream.pipe(unzipper.Parse())
            .on('entry', (entry:unzipper.Entry) => {
                let setting = null;
                entry.path.split("/").forEach((s,i,a) => {
                    setting = fileSettings.get(a.slice(0, i+1).join("/")) ?? setting
                })
                setting = setting ?? defaultSetting;
                if (entry.type === "Directory" && setting != FileSettings.Ignore) {
                    if (!fs.existsSync(entry.path))
                        fs.mkdirSync(entry.path)
                } else
                    switch (setting) {
                        case FileSettings.Ignore: 
                            entry.autodrain()
                            break;
                        case FileSettings.DontOverride:
                            if (!fs.existsSync(entry.path)) {
                                if (!fs.existsSync(resolve(entry.path, "..")))
                                    fs.mkdirSync(resolve(entry.path, ".."))
                                entry.pipe(fs.createWriteStream(entry.path))
                            } else 
                                entry.autodrain()
                            break;
                        case FileSettings.Override: 
                            if (!fs.existsSync(resolve(entry.path, "..")))
                                 fs.mkdirSync(resolve(entry.path, ".."))
                            entry.pipe(fs.createWriteStream(entry.path))
                            break;
                    }
            })
        })
        stream.on("close", () => {
            fs.unlinkSync(file.path)
            console.log("[INFO][Update] Update compleated. Please restart.")
        })
    }
}

export { Updater, FileSettings }
