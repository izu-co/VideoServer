import * as yargs from "yargs";

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
    .argv;

import * as express from "express";
import * as fs from "fs";
const app = express();


if (!fs.existsSync(argv["Video Directory"])) {
    console.log("[ERROR] Please provide a valid video directory path.")
    process.exit(1)
}

let VideoNameExtensions = ["mp4"]

export {argv, app, VideoNameExtensions}

import * as router from "./routes/index"
import { init } from "./routes/ExpressUses";
import * as fileStuff from "./backend/fileStuff";
import * as loginBackend from "./backend/UserMangement";

init()

app.use("/", router)


app.listen(3000, "0.0.0.0", function() {
    console.log('App listening at http://%s:%s', "localhost", "3000");
})


async function checkCookies() {
    await loginBackend.checkTokenForValid();
    setTimeout(() => { checkCookies() }, (1000 * 60));
}

checkCookies();

if (!argv.debug)
    fileStuff.createImages(argv["Video Directory"], false, 5, 3, argv.debug);