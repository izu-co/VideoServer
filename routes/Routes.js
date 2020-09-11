
const loginBackend = require("../backend/UserMangement")

module.exports = {
    /**
     * @param {import("express").Request} req 
     * @param {import("express").Response} res 
     * @param {import("express").NextFunction} next 
     */
    "getUserPOST": function (req, res, next) {
        if (req.method === "POST")
            loginBackend.checkToken(req.body.token, req.header('x-forwarded-for') || req.socket.remoteAddress).then(user => {
                if (user["status"]) {
                    res.locals.user = user["user"];
                    next();
                } else
                    res.send(user)
            })
        else 
            next()
    },
    /**
     * @param {import("express").Request} req 
     * @param {import("express").Response} res 
     * @param {import("express").NextFunction} next 
     */
    "GetUserGET": function (req, res, next) {
        if (req.method === "GET")
            if (req["cookies"]["token"]) {
                loginBackend.checkToken(req["cookies"]["token"], req.header('x-forwarded-for') || req.socket.remoteAddress).then(user => {
                    if (user["status"]) {
                        res.locals.user = user["user"]
                        next()
                    } else
                        res.redirect("/login")
                })
            } else
                res.redirect("/login")
        else
            next()
    },
    /**
     * @param {Array} Arguments 
     */
    "requireArgumentsPost": function(Arguments) {
        return function (req, res, next) {
            if (req.method !== "POST") 
                next()
            else {
                let goOn = true;
                for(let i = 0; i<Arguments.length; i++) {
                    if (req.body[Arguments[i]] === undefined) {
                        res.status(400).send({"status" : false, "reason": "Missing Body argument '" + Arguments[i] + "'"})
                        goOn = false;
                        break
                    }
                }
                if (goOn)
                    next();
            }
        }
    }
}