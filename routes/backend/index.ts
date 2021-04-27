import express from "express"
const router = express.Router();

import addUserRoute from "./addUser"
import changeActiveRoute from "./changeActive"
import changePassRoute from "./changePass"
import checkTokenRoute from "./checkToken"
import deleteTokenRoute from "./deleteToken"
import FileData from "./FileData"
import getFilesRoute from "./getFiles"
import getTimeRoute from "./getTime"
import getUserDataRoute from "./getUserData"
import getUsersRoute from "./getUsers"
import loginRoute from "./login"
import setTimeRoute from "./setTime"
import setUserDataRoute from "./setUserData"
import logoutRoute from "./logout"
import getWatcherRoute from "./getWatchers"
import getSortTypesRoute from "./getSortTypes"
import addToWatchListRoute from "./addWatchList"
import removeFromWatchListRoute from "./removeWatchList"
import setStarsRoute from "./setStars"
import getStarsRoute from "./getStars"

/**Post Routes Start */
router.use('/', 
addUserRoute,
changeActiveRoute,
changePassRoute,
checkTokenRoute,
deleteTokenRoute,
FileData,
getFilesRoute,
getTimeRoute,
getUserDataRoute,
getUsersRoute,
loginRoute,
setTimeRoute,
setUserDataRoute,
logoutRoute,
getWatcherRoute,
getSortTypesRoute,
addToWatchListRoute,
removeFromWatchListRoute,
setStarsRoute,
getStarsRoute)

/** Post Routes End */

export = router;