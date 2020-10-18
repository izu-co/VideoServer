import * as express from "express";
const router = express.Router()
import { GetUserGET } from "../Routes";

router.route('/')
    .get(GetUserGET, getRouteHandler)

function getRouteHandler(_req:express.Request, res:express.Response) {
    res.redirect("/player/videoShow.html?path=")
}


export = router;