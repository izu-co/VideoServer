import { Response } from '../../interfaces';
import { db } from '../..';

function logout(tokenToLogout:string): Response {
    db.prepare('DELETE FROM tokens WHERE token=?').run(tokenToLogout);
    return {
        status: true
    };
}

export { logout };