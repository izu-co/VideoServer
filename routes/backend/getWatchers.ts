import * as express from "express"
import * as Path from "path";
import * as index from "../../index"
import { requireArgumentsPost, getUserPOST } from "../Routes";
const router = express.Router()

let filename = __filename.split(Path.sep)[__filename.split(Path.sep).length - 1].split(".");
let routeName = filename.slice(0, filename.length - 1).join(".");

router.route('/' + routeName + '/')
    .post(requireArgumentsPost(["token"]), getUserPOST ,postRouteHandler);

function postRouteHandler(req:express.Request, res:express.Response) {
    res.send({
        status: true,
        data: index.app.locals.streams
    })
}

export = router;