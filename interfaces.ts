import {
    PathLike
} from 'fs';

export type Permission = 'Admin' | 'User'

export interface IntroSkipInterface {
    [path: string]: {
        'startTime': number,
        'stopTime': number
    }
}

export interface TokenInterface {
    'when': number,
    'to': number,
    'token': string,
    'ip': string
}

export interface LoginInterface {
    [uuid: string]: {
        'username': string,
        'password': string,
        'perm': Permission,
        'active': boolean
    }
}

export interface StatusInterface {
    [username: string]: {
        [path: string]: number
    }
}

export interface SettingsDataInterface {
    'volume': number
}

export interface SettingsInterface {
    'default': {
        'volume': number
    },
    [username: string]: SettingsDataInterface
}

export interface PathCheck {
    'path': PathLike,
    'exists': boolean,
    'backup' ? : PathLike
}

export type CheckPathResponse = {
    'status': true,
    'data': string
} | {
    'status': false,
    'reason': string
}

export type WatchListResponse = {
    'status': true,
    'data': 'added'|'removed'
} | {
    'status': false,
    'reason': string
}

export interface ProgrammSettingsInterface {
    'Video Directory' ? : PathLike,
    'debug' ? : boolean,
    'Working Directory' ? : PathLike,
    'sync' ? : boolean
    'disableUpdate' ? : boolean
}

export type UserAccountInfo = {
    'UUID': string,
    'username': string,
    'password': string,
    'perm': Permission,
    'active': boolean
}

export type UserAccountInfoResponse = {
    'status': true,
    'data': Array<UserAccountInfo>
} | {
    'status': false,
    'reason': string
}

export type Response = {
    'status': false,
    'reason': string
} | {
    'status': true
}

export type FileData = {
    'name': string,
    'Path': string,
    'type': 'folder',
    'image': string,
    'watchList': boolean,
} | {
    'name': string,
    'Path': string,
    'type': 'video',
    'image': string,
    'watchList': boolean
    'timeStemp'?: number
}

export interface SkipData {
    'startTime': number,
    'stopTime': number,
    'next'?: string,
    'current': string,
    'pathSep': string
}


export interface UserDataResponse {
    'status': boolean,
    'data'?: {
        'volume'?: string
    } | object
}

export interface Token {
    'when':number,
    'to':number,
    'token':string,
    'ip':string
}

export interface User {
    'username':string,
    'password':string,
    'perm': Permission,
    'active': boolean,
    'uuid': string
}

export type SecretUser = {
    'status': true,
    'data': {
        'username': string,
        'perm': Permission,
        'active': boolean
    }
} | {
    'status': false,
    'reason': string
}

export type UserRequestResponse = {
    'status': true,
    'data': User,
} | {
    'status': false,
    'reason': string
}

export type TokenResponse = {
    'status': true,
    'data': string,
    'reason'?: string
} | {
    'status': false,
    'reason': string
}

export type GetFilesResponse = {
    'status': false,
    'reason': string
} | {
    'status': true,
    'data': {
        'pathSep': string,
        'files': Array<FileData>
    }
}

export type SortTypeResponse = {
    'status': true,
    'data': string[]
} | {
    'status': false,
    'reason': string
}

export type StarResponse = {
    'status': true,
    'data': 0|1|2|3|4|5,
} | {
    'status': false,
    'reason': string
}

export enum SortTypes {
    File = 'Nach Ordner', Created = 'Zuletzt hinzugefügt', WatchList = 'Watchlist'
}