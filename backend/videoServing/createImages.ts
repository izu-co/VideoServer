import * as child_process from "child_process";
import { Status } from "../util";

function createImages(path:string, override:boolean, writeOutput:boolean): Status {
    console.log("[INFO][ImageCreation] Startet creating of Images!")
       
    var proc = child_process.spawn("java", ["-jar", "./java/ThumbnailGenerator-1.2.jar",  path, "" + override])

    proc.stdout.on('data', (data: string | string[]) => {
        if (writeOutput && (data.toString().trim().length !== 0))
            console.log("[INFO][ImageCreation] " + data.toString().replace("\n", ""))
    });
          
    proc.stderr.on('data', (data: string | string[]) => {
        if (writeOutput && (data.toString().trim().length !== 0))
            console.log("[INFO][ImageCreation] " + data.toString().replace("\n", ""))
    });
          
    proc.on('close', (code: any) => {
        console.log(`[INFO][ImageCreation] Image Creation done with code ${code}`);
    });
    return {"status" : true}
}

export {createImages}