import * as yargs from "yargs";
import fs from "fs"
import { settingsInterface } from "./interfaces";

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
    .option("beta", {
        boolean: true,
        default: false,
        describe: "Set this to true if you want to download beta versions!"
    })
    .argv;
let data:settingsInterface
if (fs.existsSync("settings.json")) 
    data = <settingsInterface> JSON.parse(fs.readFileSync("settings.json").toString())
if (!fs.existsSync("data"))
    fs.mkdirSync("data")
argv["Video Directory"] = (data!==undefined&&data["Video Directory"]!==undefined)?data["Video Directory"].toString():false || argv["Video Directory"]
argv["Working Directory"] = (data!==undefined&&data["Working Directory"]!==undefined)?data["Working Directory"].toString():false || argv["Working Directory"]
argv.debug = (data)?data.debug:false || argv.debug


export {argv}