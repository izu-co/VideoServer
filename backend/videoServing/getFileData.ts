import { SkipData, BackendRequest } from '../../interfaces';
import { checkPath, isEmptyObject } from '../util';
import * as fs from 'fs';
import * as Path from 'path';
import * as index from '../../index';

function getFileData (path:string) : BackendRequest<SkipData> {
    const pathCeck = checkPath(path);
    if (pathCeck.isOk === false)
        return pathCeck;
    path = pathCeck.value;
    if (!fs.existsSync(path))
        return { isOk: false, statusCode: 400, message: 'The given path does not exist'};
    const ret = {};

    const skip = index.db.prepare('SELECT * FROM intros WHERE path=?').get(path);
    if (skip !== undefined)
        ret['skip'] = {
            'startTime' : skip['startTime'],
            'stopTime' : skip['endTime']
        };
    else 
        ret['skip'] = {
            'startTime' : -1,
            'stopTime' : -1
        };

    const files = fs.readdirSync(path.substring(0, path.lastIndexOf(Path.sep))).filter(file => index.VideoNameExtensions.includes(file.substring(file.lastIndexOf('.') + 1)));
    const current = files.indexOf(path.substring(path.lastIndexOf(Path.sep) + 1));    
    if (current + 1 != files.length) {
        ret['next'] = Path.join(path.substring(0, path.lastIndexOf(Path.sep)).replace(index.argv['Video Directory'], ''), files[current+1]);
    }    
    
    ret['pathSep'] = Path.sep;
    ret['current'] = path.substring(index.argv['Video Directory'].length);
    if (!isEmptyObject(ret))
        return {
            isOk: true,
            value: ret as SkipData
        };
    else 
        return null;
}

export {getFileData};