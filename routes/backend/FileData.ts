import * as express from 'express';
import * as fileStuff from '../../backend/fileStuff';
import * as Path from 'path';
import { getUser, requireArguments } from '../Routes';
const router = express.Router();

const filename = __filename.split(Path.sep)[__filename.split(Path.sep).length - 1].split('.');
const routeName = filename.slice(0, filename.length - 1).join('.');

router.route('/' + routeName + '/')
    .get(getUser(true), requireArguments([
        { name: 'token' },
        { name: 'path' }
    ]), getRouteHandler);

function getRouteHandler(req:express.Request, res:express.Response) {
    const answer = fileStuff.getFileData(req.query.path as string);
    if (answer.isOk === true) {
        res.status(200).json(answer.value).end()
    } else {
        res.status(answer.statusCode).end(answer.message)
    }
}

export = router;