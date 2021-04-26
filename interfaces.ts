import {
    PathLike
} from "fs";

export interface IntroSkipInterface {
    [path: string]: {
        "startTime": number,
        "stopTime": number
    }
}

export interface TokenInterface {
    "when": number,
    "to": number,
    "token": string,
    "ip": string
}

export interface LoginInterface {
    [uuid: string]: {
        "username": string,
        "password": string,
        "perm": "User" | "Admin",
        "active": true | false
    }
}

export interface StatusInterface {
    [username: string]: {
        [path: string]: number
    }
}

export interface SettingsDataInterface {
    "volume": number
}

export interface SettingsInterface {
    "default": {
        "volume": number
    },
    [username: string]: SettingsDataInterface
}

export interface pathCheck {
    "path": PathLike,
    "exists": boolean,
    "backup" ? : PathLike
}

export interface settingsInterface {
    "Video Directory" ? : PathLike,
    "debug" ? : boolean,
    "Working Directory" ? : PathLike,
    "sync" ? : boolean
    "disableUpdate" ? : boolean
}