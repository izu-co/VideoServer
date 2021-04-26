import { Request, Response } from "express";
import * as express from "express"
import * as fileStuff from "../../backend/fileStuff";
import * as Path from "path";
import { requireArguments } from "../Routes";
const router = express.Router()

let filename = __filename.split(Path.sep)[__filename.split(Path.sep).length - 1].split(".");
let routeName = filename.slice(0, filename.length - 1).join(".");


router.route('/' + routeName + '/')
    .delete(requireArguments(["token", "path"]), postRouteHandler);

function postRouteHandler(req:Request, res:Response) {
    let response = fileStuff.removeFromWatchList(req.body.token, req.header('x-forwarded-for') || req.socket.remoteAddress, req.body.path)
    res.send(response)
}


export = router;