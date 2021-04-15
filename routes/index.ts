import * as express from "express";
const router = express.Router();

import backendRouter from "./backend/index"

router.use('/',
backendRouter)
router.use(notFound)

function notFound(req:express.Request, res:express.Response) {
    switch (req.method) {
        case "POST":
            res.status(404).json({"status": false, "reason": "Not found"})
            break;
        case "GET":
            res.redirect("/notFound")
            break;
        default:
            res.status(404).json({"status": false, "reason": "Not found"})
    }
}

export = router;