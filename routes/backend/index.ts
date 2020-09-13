import * as path from "path"
import * as express from "express"
const router = express.Router();

let dirname = __dirname.split(path.sep)[__dirname.split(path.sep).length - 1]

import * as addUserRoute from "./addUser"
import * as changeActiveRoute from "./changeActive"
import * as changePassRoute from "./changePass"
import * as checkTokenRoute from "./checkToken"
import * as clearLogsRoute from "./clearLogs"
import * as deleteTokenRoute from "./deleteToken"
import * as FileData from "./FileData"
import * as getFilesRoute from "./getFiles"
import * as getTimeRoute from "./getTime"
import * as getUserDataRoute from "./getUserData"
import * as getUsersRoute from "./getUsers"
import * as logRoute from "./log"
import * as loginRoute from "./login"
import * as reloadRoute from "./reload"
import * as setTimeRoute from "./setTime"
import * as setUserDataRoute from "./setUserData"

/**Post Routes Start */
router.use('/' + dirname, 
addUserRoute,
changeActiveRoute,
changePassRoute,
checkTokenRoute,
clearLogsRoute,
deleteTokenRoute,
FileData,
getFilesRoute,
getTimeRoute,
getUserDataRoute,
getUsersRoute,
logRoute,
loginRoute,
reloadRoute,
setTimeRoute,
setUserDataRoute)
/** Post Routes End */


export = router;