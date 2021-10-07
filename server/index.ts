import { ConnectionOptions, createConnection } from "typeorm";
import fs from "fs";
import path from "path";
import { generatePassword, makeUsername, Permissions, User } from "./models/User";
import Server, { TServerSettings } from "./server";

export type TSettings = {
  mySQL: ConnectionOptions,
  server: TServerSettings
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

(async () => {
  const settings : TSettings = JSON.parse((await fs.promises.readFile(path.join(__dirname, "serverSettings.json"))).toString());
  console.log(path.resolve(__dirname, 'models', `*.${__filename.substring(__filename.lastIndexOf('.') + 1)}`));
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

  const server = new Server(settings.server);
  await server.start();
})()