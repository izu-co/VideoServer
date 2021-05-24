import { BasicAnswer } from '../../interfaces';
import { db } from '../..';

function logout(tokenToLogout:string): BasicAnswer {
    db.prepare('DELETE FROM tokens WHERE token=?').run(tokenToLogout);
    return {
        status: true,
        data: null
    };
}

export { logout };