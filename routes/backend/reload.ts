import * as express from "express"
import * as fileStuff from "../../backend/fileStuff"
import * as Path from "path"
import * as index from "../../index"
import { getUserPOST } from "../Routes"
const router = express.Router()

let filename = __filename.split(Path.sep)[__filename.split(Path.sep).length - 1].split(".");
let routeName = filename.slice(0, filename.length - 1).join(".");

router.route('/' + routeName + '/')
    .post(getUserPOST, postRouteHandler);

function postRouteHandler(req:express.Request, res:express.Response) {
    if (res.locals.user["perm"] === "Admin")
        res.send(fileStuff.createImages(index.argv["Video Directory"], false, false))
    else 
        res.send({"status" : false, "reason" : "Permission denied!"})
}

export = router;