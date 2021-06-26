import * as express from 'express';
import * as loginBackend from '../../backend/UserMangement';
import * as Path from 'path';
import { getUser, requireArguments } from '../Routes';
const router = express.Router();

const filename = __filename.split(Path.sep)[__filename.split(Path.sep).length - 1].split('.');
const routeName = filename.slice(0, filename.length - 1).join('.');

router.route('/' + routeName + '/')
    .delete(getUser(true), requireArguments([
        { name: 'uuid' },
        { name: 'token'}
    ]), postRouteHandler);


function postRouteHandler(req:express.Request, res:express.Response) {
    const response = loginBackend.deleteToken(req.body.uuid, req.body.token, req.header('x-forwarded-for') || req.socket.remoteAddress);
    if (response.isOk === true) {
        res.status(200).end(response.value)
    } else {
        res.status(response.statusCode).end(response.message)
    }
}

export = router;