import Server, { TAPIExport } from "../server";
import express from "express";
import checkToken from "../middleware/checkToken"
import checkParam from "../middleware/checkParam";
import path from "path";
import { WatchList } from "../models/WatchList";
import { File } from "../models/Files";

const router = express.Router();

export enum SortTypes {
  FOLDER, TIME, WATCHLIST
}

export default {
  router: (videoPath) => router.get('/getFiles/', checkToken(), checkParam([
    { name: 'sortType', optional: true },
    { name: 'path', optional: true },
  ]), async (_, res) => {
    const sortType = getSortTypeFromString(res.locals.sortType);
    const requestPath = res.locals.path || '';

    const pathToCheck = path.resolve(videoPath, requestPath);
    if (!pathToCheck.startsWith(videoPath))
      return res.status(404).end();

    if (sortType === SortTypes.WATCHLIST) {
      const watchListItems = await WatchList.find({ where: { user: res.locals.user } });

      const items = await Promise.all(watchListItems.map(async a => {
        const file = await File.findOne({ where: { path: a.path } });
        if (!file) 
          return undefined;
        
        return {
          image: file.path + '.jpg',
          isDir: file.isDir,
          path: file.path,
          watchList: true
        }
      }))

      res.status(200).json(items.filter(a => a !== undefined)).end();
    } else if (sortType === SortTypes.FOLDER) {
      const files = await File.find({ })
      const filtered = files.filter((a) => {
        const testRegEx = new RegExp(escapeRegExp(pathToCheck + path.sep) 
        + '[^' + escapeRegExp(path.sep) + ']*(' + escapeRegExp(path.sep) + '|(' + Server.videoExtension.join('|') + '))$');
        return testRegEx.test(a.isDir ? a.path + path.sep : a.path)
      })
      const mapped = filtered.map(async a => {
        return {
          ...a,
          watchList: await WatchList.count({ where: { path: a.path } }) > 0
        }
      })
      res.status(200).json(await Promise.all(mapped)).end();
    } else if (sortType === SortTypes.TIME) {
      const files = await File.find({
        take: 50,
        order: {
          lastModified: "DESC"
        }
      });

      const mapped = files.map(async a => {
        return {
          ...a,
          watchList: await WatchList.count({ where: { path: a.path } }) > 0
        }
      })
      res.status(200).json(await Promise.all(mapped)).end();
    } else {
      res.status(400).end();
    }
  })
} as TAPIExport

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
}

const getSortTypeFromString = (s: string) : SortTypes => {
  if (!s)
    return SortTypes.FOLDER;
  switch(s.toUpperCase()) {
    case null:
    case 'null':
    case '':
    case 'FOLDER':
      return SortTypes.FOLDER;
    case 'TIME':
      return SortTypes.TIME;
    case 'WATCHLIST': 
      return SortTypes.WATCHLIST;
    default: 
      return SortTypes.FOLDER
  }
}