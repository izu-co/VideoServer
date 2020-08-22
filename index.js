const express = require("express")
const fs = require("fs")
const bodyParser =  require('body-parser');
const path = require('path');
const app = express();
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
const { response } = require("express");

console.stdlog = console.log.bind(console);
console.log = function(){
    exports.logs.push(Array.from(arguments));
    console.stdlog.apply(console, arguments);
}

var checkTokenPost = function (req, res, next) {
    loginBackend.checkToken(req.body.token, req.header('x-forwarded-for') || req.socket.remoteAddress).then(user => {
        if (user["status"]) {
            next();
        } else
            res.send({"status" : false, "reason" : "Permission denied!"})
    })
}

var checkTokenGet = function (req, res, next) {
    if (req["cookies"]["token"]) {
        loginBackend.checkToken(req["cookies"]["token"], req.header('x-forwarded-for') || req.socket.remoteAddress).then(user => {
            if (user["status"]) {
                next();
            } else
                res.redirect("/login/")
        })
    } else 
        res.redirect("/login/")
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

app.get("/admin.html", [checkTokenGet], function(req, res) {
    loginBackend.checkToken(req["cookies"]["token"], req.header('x-forwarded-for') || req.socket.remoteAddress).then(user => {
        if (!user["status"])
            res.send(user);
        if (user["user"]["perm"] === "Admin")
            res.sendFile(path.join(__dirname, "private", "html", "admin.html"))
        else 
            res.send("You dont have Permission to access that!")
    })
})

app.get("/logs.html", checkTokenGet, function(req, res) {
    res.sendFile(path.join(__dirname, "private", "html", "logs.html"))
})

/**
 * Post
 */

app.post('/backend/addUser', checkTokenPost, function(req, res) {
    loginBackend.checkToken(req.body.token, req.header('x-forwarded-for') || req.socket.remoteAddress).then(user => {
        if (!user["status"])
            res.send(user)
        if (user["user"]["perm"] === "Admin")
            loginBackend.addNewUser(req.body.username, req.body.password, req.body.perm).then(response => {
                res.send(response)
            });
        else 
            res.send({"status" : false, "reason": "No Permission"})
        
    })
})

app.post("/backend/getUsers/", checkTokenPost, function(req, res) {
    loginBackend.loadUsers(req.body.token, req.header('x-forwarded-for') || req.socket.remoteAddress).then(response => {
        res.send(response);
    })
})

app.post("/backend/changePass/", checkTokenPost, function(req, res) {
    loginBackend.changePassword(req.body.token, req.header('x-forwarded-for') || req.socket.remoteAddress, req.body.oldPass, req.body.newPass).then(response => {
        res.send(response);
    })
})

app.post('/backend/getUserData/', checkTokenPost, function(req,res) {
    res.send(fileStuff.getUserData(req.body.token, req.header('x-forwarded-for') || req.socket.remoteAddress))
})

app.post('/backend/setUserData/', checkTokenPost, function(req, res) {
    res.send(fileStuff.saveUserData(req.body.token, req.header('x-forwarded-for') || req.socket.remoteAddress, req.body.data))
})

app.post('/backend/login/', function(req, res) {
    loginBackend.GenerateUserToken(req.body.Username, req.body.Passwort, req.header('x-forwarded-for') || req.socket.remoteAddress).then(response => {
        res.send(response);
    })
})

app.post('/backend/checkToken/', function(req, res) {
    loginBackend.checkToken(req.body.token, req.header('x-forwarded-for') || req.socket.remoteAddress).then(response => {
        res.send(response);
    })
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
    loginBackend.checkToken(req["cookies"]["token"], req.header('x-forwarded-for') || req.socket.remoteAddress).then(user => {
        if (!user["status"])
            res.send(user)
        if (user["user"]["perm"] === "Admin")
            res.send(fileStuff.createImages(VideoPath, false, 5, 3, false))
        else 
            res.send({"status" : false, "reason" : "User is not an Admin!"})
    })
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
    loginBackend.checkToken(req["cookies"]["token"], req.header('x-forwarded-for') || req.socket.remoteAddress).then(user => {
        if (!user["status"])
            res.send(user)
        if (user["user"]["perm"] === "Admin")
            loginBackend.changeActiveState(req.body.state, req.body.uuid, req.body.token, req.header('x-forwarded-for') || req.socket.remoteAddress).then(response => {
                res.send(response);
            })
        else 
            res.send({"status" : false})
    })
})

app.post("/backend/deleteToken/", checkTokenPost, function(req, res) {
    loginBackend.checkToken(req["cookies"]["token"], req.header('x-forwarded-for') || req.socket.remoteAddress).then(user => {
        if (!user["status"])
            res.send(user)
        if (user["user"]["perm"] === "Admin")
            loginBackend.deleteToken(req.body.uuid, req["cookies"]["token"], req.header('x-forwarded-for') || req.socket.remoteAddress).then(response => {
                res.send(response);
            })
        else 
            res.send({"status" : false})
    })
})

app.post('/backend/logs/', checkTokenPost, function(req, res) {
    res.send({"status" : true, "data" : exports.logs})
})

app.post('/log/', checkTokenPost, function(req, res) {
    console.log(req.body.message)
})

app.post("/backend/clearLogs/", checkTokenPost, function(req, res) {
    loginBackend.checkToken(req["cookies"]["token"], req.header('x-forwarded-for') || req.socket.remoteAddress).then(user => {
        if (user["status"])
            return user;
        if (user["user"]["perm"] === "Admin") {
            exports.logs = [];
            console.clear();
            res.send({"status" : true})
        } else 
            res.send({"status" : false})
    })
})

app.use(checkTokenGet, function(req, res) {
    res.sendFile(path.join(__dirname, "public", "html", "notFound.html"))
})

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