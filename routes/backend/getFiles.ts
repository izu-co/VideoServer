import * as express from "express"
import * as fileStuff from "../../backend/fileStuff";
import * as Path from "path";
import { requireArguments } from "../Routes";
const router = express.Router()

let filename = __filename.split(Path.sep)[__filename.split(Path.sep).length - 1].split(".");
let routeName = filename.slice(0, filename.length - 1).join(".");

router.route('/' + routeName + '/')
    .get(requireArguments(["path", "token"]), postRouteHandler);

function postRouteHandler(req:express.Request, res:express.Response) {
    if (!(typeof req.query.token === "string") || !(typeof req.query.path === "string") || !(typeof req.query.type === "string" || req.query.type === undefined))
        return res.status(400).send({status: false, reason: "Can't parse query parameters"})
    let files = fileStuff.getFiles(<string> req.query.path, <string> req.query.token, req.header('x-forwarded-for') || req.socket.remoteAddress, <string|null> req.query.type)
    res.send({"status" : true, "data" : {
        files: files,
        pathSep: Path.sep
    }});
}


export = router;