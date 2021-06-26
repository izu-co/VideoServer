import * as express from 'express';
import * as fileStuff from '../../backend/fileStuff';
import * as Path from 'path';
import { getUser, requireArguments } from '../Routes';
const router = express.Router();

const filename = __filename.split(Path.sep)[__filename.split(Path.sep).length - 1].split('.');
const routeName = filename.slice(0, filename.length - 1).join('.');

router.route('/' + routeName + '/')
    .put(getUser(true), requireArguments([
        { name: 'path' },
        { name: 'token' },
        { name: 'stars', test: (val) => typeof val === 'number' && (val === 1 || val === 2 
            || val === 3 || val === 4 || val === 5 || val === 0)}
    ]), postRouteHandler);

function postRouteHandler(req:express.Request, res:express.Response) {
    const answer = fileStuff.setStars(req.body.token, req.header('x-forwarded-for') || req.socket.remoteAddress, req.body.path, req.body.stars);
    if (answer.isOk === true) {
        res.status(200).end(answer.value.toString());
    } else {
        res.status(answer.statusCode).end(answer.message);
    }
}

export = router;