import * as express from 'express';
import * as loginBackend from '../../backend/UserMangement';
import * as Path from 'path';
import { requireArguments } from '../Routes';
const router = express.Router();

const filename = __filename.split(Path.sep)[__filename.split(Path.sep).length - 1].split('.');
const routeName = filename.slice(0, filename.length - 1).join('.');

router.route('/' + routeName + '/')
    .post(requireArguments([
        { name: 'Username' },
        { name: 'Passwort' }
    ]), postRouteHandler);

function postRouteHandler(req:express.Request, res:express.Response) {
    const answer = loginBackend.GenerateUserToken(req.body.Username, req.body.Passwort, req.header('x-forwarded-for') || req.socket.remoteAddress);
    if (answer.isOk === true) {
        res.status(200).end(answer.value)
    } else {
        res.status(answer.statusCode).end(answer.message)
    }
}

export = router;