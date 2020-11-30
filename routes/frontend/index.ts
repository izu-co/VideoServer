import * as express from "express"
const router = express.Router();

import frontRouter from "./front"
import adminRouter from "./admin"
import loginRouter from "./login"
import settingRouter from "./settings"
import logRouter from "./logs"
import serverRouter from "./server"

router.use('/',
frontRouter,
adminRouter,
loginRouter,
settingRouter,
logRouter,
serverRouter)

export = router;