var express = require("express")
var router = express.Router()
const loginBackend = require("../../backend/UserMangement")
const Path = require("path");
const { requireArgumentsPost, getUserPOST } = require("../Routes");

__filename = __filename.split(Path.sep)[__filename.split(Path.sep).length - 1].split(".");
let routeName = __filename.slice(0, __filename.length - 1).join(".");

router.route('/' + routeName + '/')
    .post(getUserPOST ,requireArgumentsPost(["token", "username", "password", "perm"]), postRouteHandler);

/**
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 */
function postRouteHandler(req, res) {
    if (res.locals.user["perm"] === "Admin")
        loginBackend.addNewUser(req.body.username, req.body.password, req.body.perm).then(response => {
            res.send(response)
        });
    else 
        res.send({"status" : false, "reason": "No Permission"})
}


module.exports = router;