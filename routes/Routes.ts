import { Request, Response, NextFunction, Handler } from 'express';
import * as loginBackend from '../backend/UserMangement';
import slowDown from 'express-slow-down';

/**
 * @param force If true, the function will enforce its rules upon api requests
 */
export function getUser(force = false) : Handler {
    return function (req:Request, res:Response, next:NextFunction) {
        const apiRequest = req.originalUrl.startsWith('/api/');
        if (apiRequest && !force)
            return next();
        const token = req.body.token || req.cookies['token'] || req.headers['token'] || req.query['token'];
        if (!token)
            return res.status(400).end('The request payload is invalid:\nName: token => Missing')
        const user = loginBackend.checkToken(token, req.header('x-forwarded-for') || req.socket.remoteAddress);
        if (user.isOk === true) {
            res.locals.user = user.value;
            next();
        } else {
            res.status(user.statusCode).end(user.message)
        }
    };
}

export type Argument = {
    name: string,
    test?: (val: any) => boolean,
    optional?: boolean
}

export function requireArguments (toCheck:Array<Argument>) : Handler {
    return function (req:Request, res:Response, next:NextFunction) {
        const arg = (req.method === 'GET' || req.method === 'HEAD') ? req.query : req.body;
        if (!arg && toCheck.length > 0)
            return res.status(400).end('The request payload is invalid:\n' + toCheck.map(a => `Name: ${a.name} => Missing`).join('\n'))
        const missing: number[] = []
        const invalid: number[] = []
        for(let i = 0; i < toCheck.length; i++) {
            if (arg[toCheck[i].name] === undefined) {
                if (toCheck[i].optional)
                    continue;
                missing.push(i)
                continue;
            }
            if (!toCheck[i].test) 
                toCheck[i].test = (val) => typeof val === "string"
            if (!toCheck[i].test(arg[toCheck[i].name]))
                invalid.push(i)
        }
        if (missing.length > 0 || invalid.length > 0) {
            const answer = missing.map(a => `Name: ${toCheck[a].name} => Missing`).concat(invalid.map(a => `Name: ${toCheck[a].name} => Invalid`))
            return res.status(400).end('The request payload is invalid:\n' + answer.join('\n'))
        } else 
            next()
    };
}

const limiter = slowDown({
    delayAfter: 5000,
    maxDelayMs: 60 * 1000,
    delayMs: 1000
});

export { limiter };