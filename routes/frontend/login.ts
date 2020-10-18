import * as express from "express"
import * as Path from "path"
import * as index from "../../index"
import { limiter } from "../Routes"
const router = express.Router()

router.route('/login')
    .get(limiter, getRouteHandler)

function getRouteHandler(req:express.Request, res:express.Response) {
    res.sendFile(Path.join(index.argv["Working Directory"], "public", "html", "login.html"))
}


export = router;