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

export interface ProgrammSettingsInterface {
    'Video Directory' ? : PathLike,
    'debug' ? : boolean,
    'Working Directory' ? : PathLike,
    'sync' ? : boolean
    'disableUpdate' ? : boolean
}

export type UserData = {
    'UUID': string,
    'username': string,
    'password': string,
    'perm': Permission,
    'active': boolean
}

export interface Status {
    'status': true|false
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

/**
 * @deprecated Use specific types instead
 */
export type BasicAnswer = {
    'status': true,
    'data': any
} | {
    'status': false,
    'reason':string,
}

export interface SkipData {
    'startTime': number,
    'stopTime': number,
    'next'?: string,
    'current': string,
    'pathSep': string
}


export interface UserDataAnswer {
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

export interface SecretUser {
    'status': boolean,
    'reason'?:string,
    'data'?: {
        'username':string,
        'perm': Permission,
        'active': boolean
    }
}

export type UserRequestAnswer = {
    'status': true,
    'data': User,
} | {
    'status': false,
    'reason': string
}

export interface TokenAnswer {
    'status': boolean,
    'data'?: string,
    'reason'?: string
}

export type GetFilesAnswer = {
    'status': false,
    'reason': string
} | {
    'status': true,
    'data': {
        'pathSep': string,
        'files': Array<FileData>
    }
}

export enum SortTypes {
    File = 'Nach Ordner', Created = 'Zuletzt hinzugefügt', WatchList = 'Watchlist'
}