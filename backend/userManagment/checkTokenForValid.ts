import { db } from "../datebase";

function checkTokenForValid() {
    let tokens = db.prepare("SELECT * FROM tokens").all();

    for (let token of tokens) {
        if (Date.now() > token["until"])
    }
}

export { checkTokenForValid }
