import * as express from "express"
import * as Path from "path"
import * as index from "../../index"
import { GetUserGET } from "../Routes"
const router = express.Router()

router.route('/settings')
    .get(GetUserGET, getRouteHandler)

function getRouteHandler(req:express.Request, res:express.Response) {
    res.sendFile(Path.join(index.argv["Working Directory"], "private", "html", "settings.html"))
}


export = router;