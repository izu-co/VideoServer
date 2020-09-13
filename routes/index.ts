import * as express from "express";
import * as index from "../index";
import * as path from "path";
const router = express.Router();

import * as frontRouter from "./frontend/index"

router.use('/',
require('./backend/index'),
frontRouter)
router.use(notFound)

function notFound(req:express.Request, res:express.Response) {
    switch (req.method) {
        case "POST":
            res.status(404).json({"status": false, "reason": "Not found"})
            break;
        case "GET":
            res.status(404).sendFile(path.join(index.argv["Working Directory"], "public", "html", "notFound.html"))
            break;
        default:
            res.status(404).json({"status": false, "reason": "Not found"})
    }
}

export = router;