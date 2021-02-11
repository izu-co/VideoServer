import { db } from "../database";

function checkTokenForValid() {
    let tokens = db.prepare("SELECT * FROM tokens").all();

    for (let token of tokens) {
        if (Date.now() > token["until"])
            db.prepare("DELETE FROM tokens WHERE token=?").run(token["token"])
    }
}

export { checkTokenForValid }
