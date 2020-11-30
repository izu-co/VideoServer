import { NextFunction, Request, Response } from "express"
import * as express from "express"
const router = express.Router()
import * as Path from "path"
import * as index from "../../index"
import { GetUserGET, limiter } from "../Routes"

router.route('/server/')
    .get(limiter, GetUserGET, getRouteHandler)

function getRouteHandler(req:Request, res:Response, next:NextFunction) {
    if (res.locals.user["perm"] === "Admin")
        res.sendFile(Path.join(index.argv["Working Directory"], "private", "html", "server.html"))
    else 
        next()
}
export = router;