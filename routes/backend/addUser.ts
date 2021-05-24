import { Request, Response } from 'express';
import * as express from 'express';
import * as loginBackend from '../../backend/UserMangement';
import * as Path from 'path';
import { requireArguments, getUser } from '../Routes';
const router = express.Router();

const filename = __filename.split(Path.sep)[__filename.split(Path.sep).length - 1].split('.');
const routeName = filename.slice(0, filename.length - 1).join('.');


router.route('/' + routeName + '/')
    .put(getUser(true), requireArguments(['token', 'username', 'password', 'perm']), postRouteHandler);

function postRouteHandler(req:Request, res:Response) {
    if (res.locals.user['perm'] === 'Admin') {
        const response = loginBackend.addNewUser(req.body.username, req.body.password, req.body.perm);
        res.send(response);
    } else 
        res.send({'status' : false, 'reason': 'No Permission'});
}


export = router;