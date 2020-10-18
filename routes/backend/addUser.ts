import { Request, Response } from "express";
import * as express from "express"
import * as loginBackend from "../../backend/UserMangement";
import * as Path from "path";
import { requireArgumentsPost, getUserPOST } from "../Routes";
const router = express.Router()

let filename = __filename.split(Path.sep)[__filename.split(Path.sep).length - 1].split(".");
let routeName = filename.slice(0, filename.length - 1).join(".");


router.route('/' + routeName + '/')
    .post(getUserPOST ,requireArgumentsPost(["token", "username", "password", "perm"]), postRouteHandler);

function postRouteHandler(req:Request, res:Response) {
    if (res.locals.user["perm"] === "Admin")
        loginBackend.addNewUser(req.body.username, req.body.password, req.body.perm).then(response => {
            res.send(response)
        });
    else 
        res.send({"status" : false, "reason": "No Permission"})
}


export = router;