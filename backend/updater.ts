import * as fs from "fs"
import { join } from "path"
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

class Updater {
    private username:string;
    private repository:string;

    constructor(username:string, repository:string) {
        this.username = username
        this.repository = repository
    }

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
        let updateFun = this.update
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
                    path: file.path.toString()
                })
            })
        }
    }

    update(file : File) {
        let stream = fs.createReadStream(file.path, {})
        stream.on("ready", () => {
            console.log("[INFO][Update] Extracting")
            stream.pipe(unzipper.Parse())
            .on('entry', (entry:unzipper.Entry) => {
                if (entry.type === "Directory") {
                    if (!fs.existsSync(entry.path))
                        fs.mkdirSync(entry.path)
                } else
                    if (entry.path.startsWith("data") && fs.existsSync(entry.path))
                        entry.autodrain()
                    else
                        entry.pipe(fs.createWriteStream(entry.path))
            })
            fs.unlinkSync(file.path)
            console.log("[INFO][Update] Update compleated. Please restart.")
        })
    }
}

export { Updater }
