import * as express from "express"
import * as fileStuff from "../../backend/fileStuff";
import * as Path from "path";
import { requireArgumentsPost } from "../Routes";
const router = express.Router()

let filename = __filename.split(Path.sep)[__filename.split(Path.sep).length - 1].split(".");
let routeName = filename.slice(0, filename.length - 1).join(".");

router.route('/' + routeName + '/')
    .post(requireArgumentsPost(["path", "token"]), postRouteHandler);

function postRouteHandler(req:express.Request, res:express.Response) {
    fileStuff.getFiles(req.body.path, req.body.token, req.header('x-forwarded-for') || req.socket.remoteAddress).then(files => {
        res.send({"status" : true, "data" : {
            files: files,
            pathSep: Path.sep
        }});
    })
}


export = router;