import { TAPIExport } from "../server";
import express from "express";
import checkToken from "../middleware/checkToken";

const router = express.Router();

export default {
  router: router.post('/checkToken/', checkToken(),  async (_, res) => {
    res.status(200).end();
  })
} as TAPIExport