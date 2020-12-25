import path from "path"
import express from "express"
const router = express.Router();

let dirname = __dirname.split(path.sep)[__dirname.split(path.sep).length - 1]

import addUserRoute from "./addUser"
import changeActiveRoute from "./changeActive"
import changePassRoute from "./changePass"
import checkTokenRoute from "./checkToken"
import clearLogsRoute from "./clearLogs"
import deleteTokenRoute from "./deleteToken"
import FileData from "./FileData"
import getFilesRoute from "./getFiles"
import getTimeRoute from "./getTime"
import getUserDataRoute from "./getUserData"
import getUsersRoute from "./getUsers"
import logRoute from "./log"
import loginRoute from "./login"
import reloadRoute from "./reload"
import setTimeRoute from "./setTime"
import setUserDataRoute from "./setUserData"
import logoutRoute from "./logout"
import getWatcherRoute from "./getWatchers"
import getSortTypesRoute from "./getSortTypes"
import addToWatchListRoute from "./addWatchList"
import removeFromWatchListRoute from "./removeWatchList"

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
setUserDataRoute,
logoutRoute,
getWatcherRoute,
getSortTypesRoute,
addToWatchListRoute,
removeFromWatchListRoute)

/** Post Routes End */


export = router;