import * as express from 'express';
import * as fileStuff from '../../backend/fileStuff';
import * as Path from 'path';
import { getUser, requireArguments } from '../Routes';
const router = express.Router();

const filename = __filename.split(Path.sep)[__filename.split(Path.sep).length - 1].split('.');
const routeName = filename.slice(0, filename.length - 1).join('.');

router.route('/' + routeName + '/')
    .put(getUser(true), requireArguments(['path', 'token', 'percent']), postRouteHandler);

function postRouteHandler(req:express.Request, res:express.Response) {
    const response = fileStuff.saveTime(req.body.path, req.body.token, req.body.percent, req.header('x-forwarded-for') || req.socket.remoteAddress);
    res.send({'status': response});
}

export = router;