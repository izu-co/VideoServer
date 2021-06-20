import { checkPath } from '../util';
import * as loginBackend from '../UserMangement';
import { db } from '../..';
import { BackendRequest } from '../../interfaces';

function saveTime (path:string, token:string, percent:number, ip:string) : BackendRequest<undefined> {
    const pathCeck = checkPath(path);
    if (pathCeck.isOk === false)
        return pathCeck;
    path = pathCeck.value;
    const answer = loginBackend.getUserFromToken(token, ip);
    if (answer.isOk === false)
        return answer;
    if (percent < 0 || percent > 1)
        return {
            isOk: false,
            statusCode: 400,
            message: 'The percent has to be between 0 and 1'
        };
    const old = db.prepare('SELECT * FROM status WHERE UUID=? AND path=?').get(answer.value.uuid, path);

    if (old === undefined) {
        db.prepare('INSERT INTO status VALUES (?, ?, ?)').run(answer.value.uuid, path, percent);
        return {
            isOk: true,
            value: undefined
        };
    } else {
        db.prepare('UPDATE status SET data=? WHERE UUID=? AND path=?').run(percent, answer.value.uuid, path);
        return {
            isOk: true,
            value: undefined
        };
    }   
}

export {saveTime};