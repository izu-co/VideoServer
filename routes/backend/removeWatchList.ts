import { Request, Response } from 'express';
import * as express from 'express';
import * as fileStuff from '../../backend/fileStuff';
import * as Path from 'path';
import { requireArguments } from '../Routes';
const router = express.Router();

const filename = __filename.split(Path.sep)[__filename.split(Path.sep).length - 1].split('.');
const routeName = filename.slice(0, filename.length - 1).join('.');


router.route('/' + routeName + '/')
    .delete(requireArguments([
        { name: 'token' },
        { name: 'path' }
    ]), postRouteHandler);

function postRouteHandler(req:Request, res:Response) {
    const answer = fileStuff.removeFromWatchList(req.body.token, req.header('x-forwarded-for') || req.socket.remoteAddress, req.body.path);
    if (answer.isOk === true) {
        res.status(200).end(answer.value)
    } else {
        res.status(answer.statusCode).end(answer.message)
    }
}


export = router;