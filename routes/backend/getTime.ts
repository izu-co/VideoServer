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
    fileStuff.loadTime(req.body.path, req.body.token, req.header('x-forwarded-for') || req.socket.remoteAddress).then(answer => {
        if (answer !== -1)
            res.send({"status" : true, "data" : answer});
        else
            res.send({"status" : false})
    })
}

export = router;