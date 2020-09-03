const express = require("express")
const fs = require("fs")
const path = require('path');
const app = express();
const bodyParser =  require('body-parser');
const jsonParser = bodyParser.json()
const cookieParser = require('cookie-parser')
const VideoPath = "Z:" + path.sep + "Videos"

if (!fs.existsSync(VideoPath))
    VideoPath = "C:" + path.sep + "VideoTest"

exports.path = __dirname;
exports.VideoPath = VideoPath;
exports.VideoNameExtensions = ["mp4"]
exports.test = process.argv.length > 2 ? process.argv[2] === "test" : false;
exports.debug = process.argv.length > 2 ? process.argv[2] === "debug" : false;
exports.logs = [];

const fileStuff = require("./backend/fileStuff.js");
const loginBackend = require("./backend/UserMangement");

console.stdlog = console.log.bind(console);
console.log = function(){
    exports.logs.push(Array.from(arguments));
    console.stdlog.apply(console, arguments);
}

var checkTokenPost = function (req, res, next) {
    /**loginBackend.checkToken(req.body.token, req.header('x-forwarded-for') || req.socket.remoteAddress).then(user => {
        if (user["status"]) {
            next();
        } else
            res.send({"status" : false, "reason" : "Permission denied!"})
    }) */
    next()
}

var checkTokenGet = function (req, res, next) {
    /**if (req["cookies"]["token"]) {
        loginBackend.checkToken(req["cookies"]["token"], req.header('x-forwarded-for') || req.socket.remoteAddress).then(user => {
            if (user["status"]) {
                next();
            } else
                res.redirect("/login/")
        })
    } else 
        res.redirect("/login/")*/
    next()
}

app.use(express.json())
app.use(cookieParser())
app.use(jsonParser)
app.use("/favicon.ico", express.static(path.join(__dirname, "favicon.ico")))

/**
 * Public Uses
 */
app.use('/public/js', express.static(path.join(__dirname, "public", "javascript")))
app.use('/public/style', express.static(path.join(__dirname, "public", "style")))

/**
 * Private Uses
 */

app.use('/private/js', checkTokenGet, express.static(path.join(__dirname, "private", "javascript")))
app.use('/video', checkTokenGet, express.static(VideoPath))
app.use('/private/style', checkTokenGet, express.static(path.join(__dirname, "private", "style")))
app.use('/private/html', checkTokenGet, express.static(path.join(__dirname, path.join("private", "html"))))
app.use("/player/player.html", checkTokenGet, express.static(path.join(__dirname, "private", "html", "player.html")))
app.use("/player/videoShow.html", checkTokenGet, express.static(path.join(__dirname, "private", "html", "videoShow.html")))



app.get("/login/", function(req, res) {
    res.sendFile(path.join(__dirname, "public", "html", "login.html"))
});

app.get("/chooser/",  [checkTokenGet], function(req, res) {
    res.redirect("/player/videoShow.html?path=");
})

app.get("/shutdown/", [checkTokenGet], function(req, res) {
    var user = fileStuff.getUserFromToken(req["cookies"]["token"], req.header('x-forwarded-for') || req.socket.remoteAddress)
    if (user["perm"] === "Admin")
        fileStuff.shutdown();
})

app.get("/", [checkTokenGet], function(req, res) {
    res.redirect("/player/videoShow.html?path=")
})

app.get("/settings.html", [checkTokenGet], function(req, res) {
    res.sendFile(path.join(__dirname, "private", "html", "settings.html"))
})


app.use("/", require("./routes/index"))


var listener = app.listen(3000, "0.0.0.0", function() {
    var host = listener.address().address;
    var port = listener.address().port;
    console.log('App listening at http://%s:%s', host, port);
})


async function checkCookies() {
    setTimeout(() => { checkCookies() }, (1000 * 60));
    await loginBackend.checkTokenForValid();
}

checkCookies();

if (!exports.test)
    fileStuff.createImages(VideoPath, false, 5, 3, exports.debug);