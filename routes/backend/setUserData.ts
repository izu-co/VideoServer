import * as express from 'express';
import * as util from '../../backend/util';
import * as Path from 'path';
import { requireArguments, getUser } from '../Routes';
const router = express.Router();

const filename = __filename.split(Path.sep)[__filename.split(Path.sep).length - 1].split('.');
const routeName = filename.slice(0, filename.length - 1).join('.');

router.route('/' + routeName + '/')
    .put(getUser(true), requireArguments([
        { name: 'token' },
        { name: 'data', test: (val) => typeof val === 'object'}
    ]), postRouteHandler);

function postRouteHandler(req:express.Request, res:express.Response) {
    const answer = util.saveUserData(req.body.token, req.header('x-forwarded-for') || req.socket.remoteAddress, req.body.data);
    if (answer.isOk === true) {
        res.status(200).end(answer.value);
    } else {
        res.status(answer.statusCode).end(answer.message);
    }
}

export = router;