import { Handler } from "express";
import { Token } from "../models/Token";
import { Permissions } from "../models/User";


export default (requireAdminPermission = false): Handler => {
  return async (req, res, next) : Promise<void> => {
    const authHeader = req.headers.authorization;
    if (authHeader === undefined) {
      return res.status(401).json({
        error: 'Missing authorization header'
      }).end();
    }

    const authSplit = authHeader.split(' ');
    if (authSplit.length !== 2) {
      return res.status(401).json({
        error: 'Please provide authorization in the \'Token <Token>\' format'
      }).end();
    }

    if (authSplit[0].toLowerCase() !== 'token') {
      return res.status(401).json({
        error: `Unknown token format '${authSplit[0]}'. Please provide authorization in the 'Token <Token>' format`
      }).end();
    }

    const token = authSplit[1];
    
    const tokenRequest = await Token.findOne({ 
      where: {
        token: token,
        ip: req.header('x-forwarded-for') || req.socket.remoteAddress
      },
      relations: [ 'user' ]
    })

    console.log(tokenRequest, tokenRequest?.until.getTime());

    if (!tokenRequest) {
      return res.status(401).json({
        error: 'Invalid token'
      }).end();
    }

    if (requireAdminPermission && tokenRequest.user.permission !== Permissions.ADMIN) {
      return res.status(403).json({
        error: 'unauthorized'
      }).end();
    }

    res.locals.token = tokenRequest;
    res.locals.user = tokenRequest.user;
    res.locals.userToken = token;
    return next();
  };
}