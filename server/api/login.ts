import { TAPIExport } from "../server";
import express from "express";
import checkParam from "../middleware/checkParam";
import { User } from "../models/User";
import { makeToken, Token } from "../models/Token";

const router = express.Router();

export default {
  router: router.get('/login/', checkParam([
    { name: 'username' },
    { name: 'password' }
  ]), async (req, res) => {
    const ip = req.header('x-forwarded-for') || req.socket.remoteAddress;
    const user = await User.findOne({ where: { username: res.locals.username, password: res.locals.password } });
    if (!user) {
      return res.status(401).end('Username or Password incorrect')
    }
    const token = await makeToken(20);
    Token.insert({ 
      token,
      ip,
      user: user,
      until: new Date(Date.now() + 1000 * 60 * 60 * 24)
    })
    res.status(200).end(token);
  })
} as TAPIExport