import { Request, Response } from 'express';
import * as express from 'express';
import * as loginBackend from '../../backend/UserMangement';
import * as Path from 'path';
import { requireArguments, getUser } from '../Routes';
const router = express.Router();

const filename = __filename.split(Path.sep)[__filename.split(Path.sep).length - 1].split('.');
const routeName = filename.slice(0, filename.length - 1).join('.');


router.route('/' + routeName + '/')
    .put(getUser(true), requireArguments([
        { name: 'token' },
        { name: 'username' },
        { name: 'password' },
        { name: 'perm' },
    ]), postRouteHandler);

function postRouteHandler(req:Request, res:Response) {
    if (res.locals.user['perm'] === 'Admin') {
        const response = loginBackend.addNewUser(req.body.username, req.body.password, req.body.perm);
        if (response.isOk === true) 
            res.status(200).end();
        else 
            res.status(response.statusCode).end(response.message);
    } else {
        console.log(`[ERROR] User was not correctly parsed on ${routeName} request!`);
        res.status(500).end();
    }
}

export = router;