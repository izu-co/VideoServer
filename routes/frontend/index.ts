import * as express from "express"
const router = express.Router();

import * as frontRouter from "./front"
import * as adminRouter from "./admin"
import * as loginRouter from "./login"
import * as settingRouter from "./settings"
import * as logRouter from "./logs"

router.use('/',
frontRouter,
adminRouter,
loginRouter,
settingRouter,
logRouter)

export = router;