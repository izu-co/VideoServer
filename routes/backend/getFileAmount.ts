import * as express from 'express';
import * as fileStuff from '../../backend/fileStuff';
import * as Path from 'path';
import { requireArguments } from '../Routes';
const router = express.Router();

const filename = __filename.split(Path.sep)[__filename.split(Path.sep).length - 1].split('.');
const routeName = filename.slice(0, filename.length - 1).join('.');

router.route('/' + routeName + '/')
    .get(requireArguments([
        { name: 'path', test: (val) => typeof val === 'string' || val === undefined },
        { name: 'token' },
        { name: 'type', test: (val) => typeof val === 'string' || val === undefined, optional: true}
    ]), postRouteHandler);

async function postRouteHandler(req:express.Request, res:express.Response) {
    const files = await fileStuff.getFileAmount(req.query.path as string, req.query.token as string, req.header('x-forwarded-for') || req.socket.remoteAddress, req.query.type as string|undefined);
    if (files.isOk === true) {
        res.status(200).end(files.value.toString());
    } else {
        res.status(files.statusCode).end(files.message);
    }
}


export = router;