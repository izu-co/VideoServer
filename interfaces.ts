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
    'verbose': boolean
    'no-images': boolean,
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


export interface UserData {
    'volume': string
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
    'username': string,
    'perm': Permission,
    'active': boolean
}

export interface GetFilesResponse {
    'pathSep': string,
    'files': Array<FileData>
}

export type BackendRequest<T> = {
    value: T,
    isOk: true
} | {
    isOk: false,
    statusCode: number,
    message?: string
}

export type RoomInfo = {
    id: number,
    member: Array<{
        username: string,
        uuid: string
    }>,
    videoFile: string
}

export enum SortTypes {
    File = 'Nach Ordner', Created = 'Zuletzt hinzugefügt', WatchList = 'Watchlist'
}