const {app, path: dir, argv} = require("../index")
const express = require("express")
const path = require("path")
const bodyParser =  require('body-parser');
const cookieParser = require('cookie-parser');
const { GetUserGET } = require("./Routes");

app.use(express.json())
app.use(cookieParser())
app.use(bodyParser.json())
app.use("/favicon.ico", express.static(path.join(dir, "favicon.ico")))

/**
 * Public Uses
 */
app.use('/public/js', express.static(path.join(dir, "public", "javascript")))
app.use('/public/style', express.static(path.join(dir, "public", "style")))

/**
 * Private Uses
 */

app.use('/private/js', GetUserGET, express.static(path.join(dir, "private", "javascript")))
app.use('/video', GetUserGET, express.static(argv["Video Directory"]))
app.use('/private/style', GetUserGET, express.static(path.join(dir, "private", "style")))
app.use('/private/html', GetUserGET, express.static(path.join(dir, path.join("private", "html"))))
app.use("/player/player.html", GetUserGET, express.static(path.join(dir, "private", "html", "player.html")))
app.use("/player/videoShow.html", GetUserGET, express.static(path.join(dir, "private", "html", "videoShow.html")))