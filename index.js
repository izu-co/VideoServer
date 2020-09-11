const yargs = require("yargs")

let argv = yargs  
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
argv["path"] = __dirname;


const express = require("express")
const fs = require("fs")
const app = express();


if (!fs.existsSync(argv["Video Directory"])) {
    console.log("[ERROR] Please provide a valid video directory path.")
    process.exit(1)
}

exports.argv = argv;
exports.VideoNameExtensions = ["mp4"]
exports.logs = [];
exports.app = app;

const fileStuff = require("./backend/fileStuff.js");
const loginBackend = require("./backend/UserMangement");

console.stdlog = console.log.bind(console);
console.log = function(){
    exports.logs.push(Array.from(arguments));
    console.stdlog.apply(console, arguments);
}

require("./routes/ExpressUses")

app.use("/", require("./routes/index"))


var listener = app.listen(3000, "0.0.0.0", function() {
    var host = listener.address().address;
    var port = listener.address().port;
    console.log('App listening at http://%s:%s', host, port);
})


async function checkCookies() {
    await loginBackend.checkTokenForValid();
    setTimeout(() => { checkCookies() }, (1000 * 60));
}

checkCookies();

if (!exports.argv.debug)
    fileStuff.createImages(argv["Video Directory"], false, 5, 3, exports.argv.debug);