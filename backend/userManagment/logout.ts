import { BackendRequest } from '../../interfaces';
import { db } from '../..';

function logout(tokenToLogout:string): BackendRequest<undefined> {
    db.prepare('DELETE FROM tokens WHERE token=?').run(tokenToLogout);
    return {
        isOk: true,
        value: undefined
    };
}

export { logout };