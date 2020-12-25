import { TokenAnswer, generateToken } from "../util";
import { db } from "../../index";

const TokenLenght = 20;

async function GenerateUserToken (username:string, password:string, ip:string): Promise<TokenAnswer>{

    let user = db.prepare("SELECT * FROM users WHERE username=? AND password=?").get(username, password)
    if (user === undefined) return {"status" : false, "reason" : "Der Benutzername oder das Passwort ist falsch"};
    if (!user["active"])
    return {"status" : false, "reason" : "Der account ist deaktiviert!"}
    var rohtoken = await generateToken(TokenLenght);
    db.prepare("INSERT INTO tokens VALUES (?, ?, ?, ?, ?)").run(rohtoken, user["UUID"], Date.now(), new Date(Date.now() + (1000 * 60 * 60 * 24)).getTime(), ip)
    return {"status": true, "data" : rohtoken};
    
}

export {GenerateUserToken}