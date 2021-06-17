import * as express from 'express';
import * as loginBackend from '../../backend/UserMangement';
import * as Path from 'path';
import { requireArguments } from '../Routes';
const router = express.Router();

const filename = __filename.split(Path.sep)[__filename.split(Path.sep).length - 1].split('.');
const routeName = filename.slice(0, filename.length - 1).join('.');

router.route('/' + routeName + '/')
    .get(requireArguments([
        { name: 'token' }
    ]), postRouteHandler);

function postRouteHandler(req:express.Request, res:express.Response) {
    if (!(typeof req.query.token === 'string'))
        return res.status(400).send({status: false, reason: 'Can\'t parse query parameters'});
    const answer = loginBackend.loadUsers(req.query.token as string, req.header('x-forwarded-for') || req.socket.remoteAddress);
    if (answer.isOk === true) {
        res.status(200).json(answer.value).end()
    } else {
        res.status(answer.statusCode).end(answer.message)
    }
}

export = router;