import * as fs from "fs"
import { join } from "path"
import fetch from "node-fetch";
import unzipper from "unzipper";
import readline from "readline";

interface Update {
    downloadURL: string,
    preRelease: boolean
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
                                preRelease: data.prerelease
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
            fetch(update.downloadURL, {
                method: 'GET',
                headers: {
                    'User-Agent': 'github-app-updater'
                }
            }).then(data => {
                console.log("Downloading update...")
                data.body.pipe(file)  
                file.on("finish", () => updateFun({
                    path: file.path.toString()
                }))
            })
        }
    }

    update(file : File) {
        let stream = fs.createReadStream(file.path, {})

        stream.on("ready", () => {
            console.log("Extracting")
            stream.pipe(unzipper.Extract({
                path: "./"
            }))
        })
        console.log("Done")
    }
}

export { Updater }
