import * as express from "express"
import * as Path from "path"
import * as index from "../../index"
import { GetUserGET } from "../Routes"
const router = express.Router()

router.route('/logs')
    .get(GetUserGET, getRouteHandler);

function getRouteHandler(req:express.Request, res:express.Response) {
    res.sendFile(Path.join(index.argv["Working Directory"], "private", "html", "logs.html"))
}

export = router;