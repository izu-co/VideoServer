const child_process = require("child_process")
const fs = require("fs")
const path = require("path")

deleteDir("build")
const tsc = child_process.spawn("npx", ["tsc", "-p", `"${path.resolve("tsconfig.json")}"`])

function deleteDir(p) {
    if (!fs.existsSync(p))
        return;
    if (fs.statSync(p).isDirectory()) {
        for (let f of fs.readdirSync(p)) {
            let stats = fs.statSync(path.join(p, f))
            if (stats.isDirectory())
                deleteDir(path.join(p, f))
            else
                fs.unlinkSync(path.join(p, f))
        }
        fs.rmdirSync(p)
    } else
        fs.unlinkSync(p)
}