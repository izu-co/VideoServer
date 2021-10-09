import { ConnectionOptions, createConnection, Raw } from "typeorm";
import fs from "fs";
import path from "path";
import { generatePassword, makeUsername, Permissions, User } from "./models/User";
import Server, { TServerSettings } from "./server";
import { Token } from "./models/Token";
import { File } from "./models/Files";

export type TSettings = {
  mySQL: ConnectionOptions,
  server: TServerSettings,
  videoFolder: string
}

process.on("uncaughtException", (er, stack)  => {
  console.error(er, stack);
});

process.on("unhandledRejection", (er) => {
  console.error(er);
});

// let test: ConnectionOptions = { cache: false };

const generateDefaultUser = async () => {
  const count = await User.count({ where: { permission: Permissions.ADMIN } })
  if (count < 1) {
    const pass = generatePassword(10);
    const name = await makeUsername('Admin');
    await User.insert({
      isActive: true,
      permission: Permissions.ADMIN,
      password: pass,
      username: name
    });
    console.log('[INFO] Since no administrator account was found, a new one has been created.')
    console.log(` Username: '${name}'`)
    console.log(` Password: '${pass}''`)
  } 
} 

const cacheAllFiles = async (videoDir: string) => {
  const files = await getAllFilesAndDir(videoDir);
  const filtered = files.filter(a => {
    if (a[0].path.length > 255) {
      console.error(`Unable to cache file ${a[0].path} since the filepath is longer than 255 characters. Please shorten the filePath in order to view this file!`);
      return false;
    }
    return true
  })
  files.forEach(a => File.insert({ isDir: a[1].isDirectory(), path: a[0].path, lastModified: a[1].mtime }))
};

const getAllFilesAndDir = async (base: string) : Promise<[{
  path: string,
  image: string
}, fs.Stats][]> => {
  const data: [{
    path: string,
    image: string
  }, fs.Stats][] = [];
  const subEntries = await fs.promises.readdir(base);

  for (let subEntry of subEntries) {
    const wholePath = path.join(base, subEntry);
    const imagePath = path.join(base, subEntry + '.jpg');
    const stats = await fs.promises.stat(wholePath);
    const existsImage = fs.existsSync(imagePath);

    if (!existsImage)
      continue;
    if (stats.isDirectory()) {
      const subDirContent = await getAllFilesAndDir(wholePath);
      if (subDirContent.length > 0)
      data.push(...subDirContent)
    }
    data.push([{
      image: imagePath,
      path: wholePath
    }, stats]);
  }
  return data;
}

(async () => {
  const settings : TSettings = JSON.parse((await fs.promises.readFile(path.join(__dirname, "serverSettings.json"))).toString());
  settings.videoFolder = path.resolve(settings.videoFolder);
  const con = await createConnection(Object.assign(settings.mySQL, {
    type: 'mysql',
    multipleStatements: true,
    entities: [
      path.resolve(__dirname, 'models', `*.${__filename.substring(__filename.lastIndexOf('.') + 1)}`)
    ]
  }));
  if (!con.isConnected) {
    console.error("[ERROR] Database connection failed")
    process.exit(1)
  }
  await con.synchronize();
  await generateDefaultUser();
  await File.delete({ });
  await Token.delete({  });

  const server = new Server(settings.server, settings.videoFolder);
  await server.start();

  await cacheAllFiles(settings.videoFolder);
})()