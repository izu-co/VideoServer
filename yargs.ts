import * as yargs from "yargs";
import path from "path"
import fs from "fs"
import { filePathsInterface, settingsInterface } from "./interfaces";

const argv = yargs  
    .option('Video Directory', {
        alias: 'vd',
        describe: 'The Directory Path were your videos are',
        requiresArg: true,
        string: true
    })
    .option('debug', {
        boolean: true,
        default: false,
        hidden: true
    })
    .option('Working Directory', {
        string: true,
        default: __dirname,
        hidden: true,
        describe: "Dont change if you dont know what you are doing!\nYou can change the working directory if you need it.",
        alias: "wd"
    })
    .option('introFile', {
        string: true,
        default: path.join(__dirname, "data", "intros.json"),
        describe: "The path where the intro data should be safed to."
    })
    .option('loginFile', {
        string: true,
        default: path.join(__dirname, "data", "logins.json"),
        describe: "The path where the login data should be safed to."
    })
    .option('settingsFile', {
        string: true,
        default: path.join(__dirname, "data", "settings.json"),
        describe: "The path where the settings data should be safed to."
    })
    .option('statusFile', {
        string: true,
        default: path.join(__dirname, "data", "status.json"),
        describe: "The path where the status data should be safed to."
    })
    .argv;

let data:settingsInterface
if (fs.existsSync("settings.json")) 
    data = <settingsInterface> JSON.parse(fs.readFileSync("settings.json").toString())

argv["Video Directory"] = (data!==undefined&&data["Video Directory"]!==undefined)?data["Video Directory"].toString():false || argv["Video Directory"]
argv["Working Directory"] = (data!==undefined&&data["Working Directory"]!==undefined)?data["Working Directory"].toString():false || argv["Working Directory"]
argv.debug = (data)?data.debug:false || argv.debug

const filePaths:filePathsInterface = {
    settings: {
        path: (data)?data.settingsFile:false || argv.settingsFile,
        exists: fs.existsSync((data)?data.settingsFile:false || argv.settingsFile)
    },
    introSkips: {
        path: (data)?data.introFile:false || argv.introFile,
        exists: fs.existsSync((data)?data.introFile:false || argv.introFile)
    },
    logins: {
        path: (data)?data.loginFile:false || argv.loginFile,
        exists: fs.existsSync((data)?data.loginFile:false || argv.loginFile)
    },
    status: {
        path: (data)?data.statusFile:false || argv.statusFile,
        exists: fs.existsSync((data)?data.statusFile:false || argv.statusFile)
    },
}

for (let a in filePaths)
    if (!filePaths[a]["exists"]) {
        try {
            fs.writeFileSync(filePaths[a]["path"], "{}")
        } catch (e) {
            console.log("[ERROR] The path for the '" + a + "' file was not found")
            process.exit(1)
        }
    }

export {argv, filePaths}