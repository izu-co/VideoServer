import { db } from '../..';
import { getUserFromToken } from '../UserMangement';
import { checkPath } from '../util';
import { BackendRequest } from '../../interfaces';

type StarRequest = 0|1|2|3|4|5

function setStars(token: string, ip:string, path:string, stars:number) : BackendRequest<StarRequest> {

    const user = getUserFromToken(token, ip);

    if (user.isOk === false)
        return user;
    
    if (!Number.isInteger(stars) || stars < 0 || stars > 5)
        return { isOk: false, statusCode: 400, message: 'The stars has to be an integer between 0 and 5' };

    const checkedPath = checkPath(path);
    if (checkedPath.isOk === false)
        return checkedPath;

    path = checkedPath.value;

    const request = db.prepare('SELECT * FROM stars WHERE path=? AND UUID=?').get(path, user.value.uuid);

    if (request === undefined) {
        db.prepare('INSERT INTO stars VALUES (?, ?, ?)').run(user.value.uuid, path, stars);
        return {
            isOk: true,
            value: stars as StarRequest
        };
    } else {
        db.prepare('UPDATE stars SET stars=? WHERE path=? AND UUID=?').run(stars, path, user.value.uuid);
        return {
            isOk: true,
            value: db.prepare('SELECT * FROM stars WHERE path=? AND UUID=?').get(path, user.value.uuid)['stars']
        };
    }

}

function getStars(token:string, ip:string, path:string) : BackendRequest<StarRequest> {
    const user = getUserFromToken(token ,ip);

    if (user.isOk === false) return user;

    const checkedPath = checkPath(path);

    if (checkedPath.isOk === false)
        return checkedPath;

    path = checkedPath.value;

    const request = db.prepare('SELECT * FROM stars WHERE path=? AND UUID=?').get(path, user.value.uuid);
    
    return {
        isOk: true,
        value: request === undefined ? 0 : request['stars']
    };
}

export { getStars, setStars };