const express = require("express")
const fs = require("fs")
const bodyParser =  require('body-parser');
var path = require('path');
var app = express();
var jsonParser = bodyParser.json()
var cookieParser = require('cookie-parser')
var VideoPath = "C:" + path.sep + "VideoTest"

if (!fs.existsSync(VideoPath))
    VideoPath = "Z:" + path.sep + "Anime"

var loginBackend = require('./public/backend/loginBackend.js');
const fileStuff = require("./public/backend/fileStuff.js");

exports.path = __dirname;
exports.VideoPath = VideoPath;
exports.VideoNameExtensions = ["mp4"]
exports.test = false

app.use(express.json())
app.use(cookieParser())
app.use(jsonParser)
app.use('/video', express.static(VideoPath))
app.use('/js', express.static(path.join(__dirname, "public/javascript")))
app.use('/style', express.static(path.join(__dirname, "public/style")))
app.use('/player', express.static(path.join(__dirname, "videoPlayer")))
app.use("/favicon.ico", express.static(path.join(__dirname, "favicon.ico")))


var checkTokenPost = function (req, res, next) {
    if (loginBackend.checkToken(req.body.token, req.header('x-forwarded-for') || req.socket.remoteAddress)["status"]) {
        next();
    } else
        res.send({"status" : false, "reason" : "Permission denied!"})
}

var checkTokenGet = function (req, res, next) {
    if (req["cookies"]["token"]) {
        if (loginBackend.checkToken(req["cookies"]["token"], req.header('x-forwarded-for') || req.socket.remoteAddress)["status"]) {
            next();
        } else
            res.redirect("../login/")
    }
    else 
        res.redirect("../login/")
}

app.get("/login/", function(req, res) {
    res.sendFile(__dirname + "/login.html")
});

app.get("/chooser/", [checkTokenGet], function(req, res) {
    res.redirect("/player/videoShow.html?path=" + VideoPath);
})

app.get("/shutdown/", [checkTokenGet], function(req, res) {
    var user = fileStuff.getUserFromToken(req["cookies"]["token"], req.header('x-forwarded-for') || req.socket.remoteAddress)
    if (user["perm"] === "Admin")
        fileStuff.shutdown();
})

app.get("/", [checkTokenGet], function(req, res) {
    res.redirect("/player/videoShow.html?path=" + VideoPath)
})

app.get("/settings.html", [checkTokenGet], function(req, res) {
    res.sendFile(path.join(__dirname, "videoPlayer", "settings.html"))
})

app.get("/admin.html", [checkTokenGet], function(req, res) {
    var user = loginBackend.checkTokenReturnEveryThing(req["cookies"]["token"], req.header('x-forwarded-for') || req.socket.remoteAddress)
    if (user["user"]["perm"] === "Admin")
        res.sendFile(path.join(__dirname, "videoPlayer", "admin.html"))
    else 
        res.send("You dont have Permission to access that!")
})

/**
 * Post
 */

app.post("/backend/getUsers/", checkTokenPost, function(req, res) {
    res.send(loginBackend.getUsers(req.body.token, req.header('x-forwarded-for') || req.socket.remoteAddress))
})

app.post("/backend/changePass/", checkTokenPost, function(req, res) {
    res.send(loginBackend.changePassword(req.body.token, req.header('x-forwarded-for') || req.socket.remoteAddress, req.body.oldPass, req.body.newPass))
})

app.post('/backend/getUserData/', checkTokenPost, function(req,res) {
    res.send(fileStuff.getUserData(req.body.token, req.header('x-forwarded-for') || req.socket.remoteAddress))
})

app.post('/backend/setUserData/', checkTokenPost, function(req, res) {
    res.send(fileStuff.saveUserData(req.body.token, req.header('x-forwarded-for') || req.socket.remoteAddress, req.body.data))
})

app.post('/backend/login/', function(req, res) {
    res.send(loginBackend.getToken(req.body.Username, req.body.Passwort, req.header('x-forwarded-for') || req.socket.remoteAddress));
})

app.post('/backend/checkToken/', function(req, res) {
    res.send(loginBackend.checkToken(req.body.token, req.header('x-forwarded-for') || req.socket.remoteAddress));
})

app.post('/backend/getFiles/', checkTokenPost, function(req, res) {
    res.send({"status" : true, "files" : fileStuff.getFiles(req.body.path, req.body.token, req.header('x-forwarded-for') || req.socket.remoteAddress)});
})

app.post('/backend/getTime/', checkTokenPost, function(req, res) {
    var answer = fileStuff.loadTime(req.body.path, req.body.token, req.header('x-forwarded-for') || req.socket.remoteAddress);
    if (answer !== -1)
        res.send({"status" : true, "time" : answer});
    else
        res.send({"status" : false})
})

app.post("/backend/reload/", checkTokenPost, function(req, res) {
    var user = loginBackend.checkTokenReturnEveryThing(req["cookies"]["token"], req.header('x-forwarded-for') || req.socket.remoteAddress)
    if (user === null)
        res.send({"status" : false, "reason" : "User not found!"})
    if (user["user"]["perm"] === "Admin")
        res.send(fileStuff.createImages(VideoPath, false, 5, 3, false))
    else 
        res.send({"status" : false, "reason" : "User is not an Admin!"})
})

app.post('/backend/setTime/', checkTokenPost, function(req, res) {
    fileStuff.saveTime(req.body.path, req.body.token, req.body.percent, req.header('x-forwarded-for') || req.socket.remoteAddress);
    res.send({"status" : true}); 
})

app.post('/backend/FileData/', checkTokenPost, function(req, res) {
    var answer = fileStuff.getFileData(req.body.path, req.header('x-forwarded-for') || req.socket.remoteAddress);
    if (answer !== null)
        res.send({"status" : true, "response" : answer});
    else
        res.send({"status" : false})
})

app.post("/backend/changeActive/", checkTokenPost, function(req, res) {
    var user = loginBackend.checkTokenReturnEveryThing(req["cookies"]["token"], req.header('x-forwarded-for') || req.socket.remoteAddress)
    if (user["user"]["perm"] === "Admin")
        res.send(loginBackend.changeActiveState(req.body.state, req.body.username))
    else 
        res.send({"status" : false})
})

app.post("/backend/deleteToken/", checkTokenPost, function(req, res) {
    var user = loginBackend.checkTokenReturnEveryThing(req["cookies"]["token"], req.header('x-forwarded-for') || req.socket.remoteAddress)
    if (user["user"]["perm"] === "Admin")
        res.send(loginBackend.deleteToken(req.body.username))
    else 
        res.send({"status" : false})
})

app.post('/log/', checkTokenPost, function(req, res) {
    console.log(req.body.message)
})

app.use(function(req, res) {
    res.sendFile(path.join(__dirname, "videoPlayer", "notFound.html"))
})

var listener = app.listen(3000, "0.0.0.0", function() {
    var host = listener.address().address;
    var port = listener.address().port;
    console.log('App listening at http://%s:%s', host, port);
})

checkCookies();

async function checkCookies() {
    setTimeout(() => { checkCookies() }, (1000 * 60));
    loginBackend.checkTokenForValid();
}

fileStuff.createImages(VideoPath, false, 5, 3, false);