import express from "express";
import fs  from "fs";
import { Server as HTTPServer, createServer as createHTTPServer } from "http";
import { Server as HTTPSServer, createServer as createHTTPSServer } from "https";
import path from "path";
import { json } from "body-parser";
import cors from "cors";

export type TServerSettings = {
  httpPort: number,
  httpsPort: number|null,
  sslKeyPath: string|null,
  sslCertPath: string|null
}

export type TAPIExport = {
  router: express.Router,
}

export default class Server {
  private key: Buffer;
  private cert: Buffer;
  private ports: { http: number; https: number | null; };
  private app : {
    express: express.Express,
    http: HTTPServer,
    https: HTTPSServer|undefined
  }

  constructor(settings: TServerSettings) {
    if (settings.httpsPort && settings.sslCertPath && settings.sslKeyPath) {
      this.key = fs.readFileSync(settings.sslKeyPath);
      this.cert = fs.readFileSync(settings.sslCertPath);      
    }
    this.ports = {
      http: settings.httpPort,
      https: settings.httpsPort
    }
  }

  public async start() {
    const expressApp = await this.buildApp();

    const httpServer = createHTTPServer(expressApp);
    httpServer.listen(this.ports.http, () => {
      console.log('[INFO] HTTP listening.')
    });

    const addressInUse = (e: Error) => {
      if (e.name === 'EADDRINUSE') {
        console.error('[ERROR] The port is already in use!)')
        process.exit();
      }
    }

    httpServer.on('error', addressInUse); 

    let httpsServer: undefined|HTTPSServer;

    if (this.ports.https !== null) {
      httpsServer = createHTTPSServer({
        key: this.key,
        cert: this.cert
      }, expressApp)
      httpsServer.listen(this.ports.https, () => {
        console.log('[INFO] HTTPS listening.')
      })
      httpsServer.on('error', addressInUse);
      expressApp.use((req, res, next) => {
          if (!req.secure) {
              if (!req.headers.host)
                  return;
              return res.redirect(308, 'https://' + req.headers.host.split(':')[0] + (this.ports.https !== 443 ? ':' + this.ports.https : '') + req.url);
          }
          next();
      });
    }

    this.app = {
      express: expressApp,
      http: httpServer,
      https: httpsServer
    }
  }


  private async buildApp() : Promise<express.Express> {
    const app = express();

    app.use(cors());
    app.use(json());
    app.use(express.static(path.resolve(__dirname, 'public')))

    let apiEndPoints = getAllFiles(path.resolve(__dirname, 'api'));

    let importData = await Promise.all(apiEndPoints.map(async a => {
      let cleanedPath = a.path.replace(path.resolve(__dirname, 'api'), '').replace(/\\/g, '/')
      return {
        ...a,
        path: cleanedPath.substring(0, cleanedPath.lastIndexOf('.')),
        importData: await awaitImport<TAPIExport>(a.path)
      }
    }))

    importData.forEach(a => {
      console.log(a);
      app.use(`/api`, a.importData.router)
    })

    return app;
  }
}

const getAllFiles = (base: string) : { name: string, path: string }[] => {
  let ret: { name: string, path: string }[] = [];

  const sub = fs.readdirSync(base);
  for (let subPath of sub) {
    let whole = path.join(base, subPath);
    let stats = fs.statSync(whole);
    if (stats.isDirectory()) {
      ret = ret.concat(ret, getAllFiles(whole))
    } else {
      ret.push({
        name: subPath,
        path: whole
      })
    }
  }

  return ret;
}

const awaitImport = async <T>(path: string) : Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    import(path).then(a => resolve(a.default)).catch(reject);
  })
}