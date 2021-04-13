import { UserRequestAnswer, User } from "../util";
import { db } from "../../index";

function getUserFromToken (token:string, ip:string): UserRequestAnswer {

    let tokenUser = db.prepare("SELECT * FROM tokens WHERE token=?").get(token)

    if (tokenUser === undefined) return { "status" : false, "reason" : "User not Found" }
    if (tokenUser["ip"] !== ip)  return { "status" : false, "reason" : "User not Found" }

    let User = db.prepare("SELECT * FROM users WHERE UUID=?").get(tokenUser["UUID"])

    if (User === undefined) return { status : false, reason : "Can't get the user assosiated with the token. Please report to an admin!"}
    if (User["active"] !== "true") return { status: false, reason: "The account has been disabled!"}

    return {
        status: true,
        data: {
            active: User["active"] === "true" ? true : false,
            password: User["password"],
            perm: User["perm"],
            username: User["username"],
            uuid: User["UUID"]
        }
    }
}

export {getUserFromToken}