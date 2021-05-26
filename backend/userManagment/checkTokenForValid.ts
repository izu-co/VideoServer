import { db } from '../database';

function checkTokenForValid() : void {
    const tokens = db.prepare('SELECT * FROM tokens').all();

    for (const token of tokens) {
        if (Date.now() > token['until'])
            db.prepare('DELETE FROM tokens WHERE token=?').run(token['token']);
    }
}

export { checkTokenForValid };
