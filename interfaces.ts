import { PathLike } from "fs";

export interface IntroSkipInterface {
    [path:string] : {
        "startTime": number,
        "stopTime": number
    }
}

export interface TokenInterface {
    "when":number,
    "to":number,
    "token":string,
    "ip":string
}

export interface LoginInterface {
    [uuid:string]: {
        "username": string,
        "password": string,
        "perm": "User"|"Admin",
        "active": true|false,
        "token": Array<TokenInterface>
    }
}

export interface StatusInterface {
    [username:string]: {
        [path:string]: number
    }
}

export interface SettingsDataInterface {
    "volume": number
}

export interface SettingsInterface {
    "default": {
        "volume": number
    },
    [username:string]: SettingsDataInterface
}

export interface cacheInterface {
    "introSkips": IntroSkipInterface
    "logins": LoginInterface
    "settings": SettingsInterface,
    "status": StatusInterface
}

export interface pathCheck {
    "path": PathLike,
    "exists": boolean,
    "backup"?: PathLike
}
export interface filePathsInterface {
    "introSkips": pathCheck,
    "logins": pathCheck,
    "settings": pathCheck,
    "status": pathCheck
}

export interface settingsInterface {
    "Video Directory"?: PathLike,
    "debug"?: boolean,
    "Working Directory"?:PathLike,
    "introFile"?: PathLike,
    "loginFile"?: PathLike,
    "settingsFile"?: PathLike,
    "statusFile"?: PathLike
}