import { TokenAnswer, readLogins, writeLogins, generateToken } from "../util";

const TokenLenght = 20;

async function GenerateUserToken (username:string, password:string, ip:string): Promise<TokenAnswer>{
    var data = readLogins()
    let keys = Object.keys(data);
    for (let i = 0; i < keys.length; i++) {
        var user = data[keys[i]];
        if (user["username"] === username && user["password"] === password) {
            if (!user["active"])
                return {"status" : false, "reason" : "Der account ist deaktiviert!"}
            var rohtoken = await generateToken(TokenLenght);
            var token = {
                "when" : Date.now(),
                "to" : new Date(Date.now() + (1000 * 60 * 60 * 24)).getTime(),
                "token" : rohtoken,
                "ip" : ip
            }
            var tokens = user["token"];
            tokens.push(token)
            user["token"] = tokens;
            data[keys[i]] = user;
            return {"status": writeLogins(data), "data" : rohtoken};
        }
    }
    return {"status" : false, "reason" : "Der Benutzername oder das Passwort ist falsch"};
}

export {GenerateUserToken}