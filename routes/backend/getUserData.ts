import * as express from 'express';
import * as util from '../../backend/util';
import * as Path from 'path';
import { requireArguments } from '../Routes';
const router = express.Router();

const filename = __filename.split(Path.sep)[__filename.split(Path.sep).length - 1].split('.');
const routeName = filename.slice(0, filename.length - 1).join('.');

router.route('/' + routeName + '/')
    .get(requireArguments(['token']), postRouteHandler);

function postRouteHandler(req:express.Request, res:express.Response) {
    if (!(typeof req.query.token === 'string'))
        return res.status(400).send({status: false, reason: 'Can\'t parse query parameters'});
    const answer = util.getUserData(<string> req.query.token, req.header('x-forwarded-for') || req.socket.remoteAddress);
    res.send(answer);
}


export = router;