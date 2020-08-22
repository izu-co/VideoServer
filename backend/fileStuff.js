var child_process = require("child_process")
const fs = require("fs")
const Path = require("path")
const index = require("../index")
const loginBackend = require("./UserMangement")

module.exports = {
    /**
     * @param {string} path 
     * @param {boolean} override
     * @param {number} maxRamInt
     * @param {number} minRamInt
     * @param {boolean} writeOutput
     */
    createImages : function(path, override, maxRamInt, minRamInt, writeOutput) {
        console.log("Startet creating of Images!")
        
        var proc = child_process.spawn("java", ["-Xmx" + maxRamInt + "G", "-Xms" + minRamInt + "G", "-jar", "./java/images.jar",  path, override])

        proc.stdout.on('data', (data) => {
            if (writeOutput || !data.includes("skiped"))
                console.log(data.toString())
        });
          
        proc.stderr.on('data', (data) => {
            if (writeOutput || !data.includes("skiped"))
                console.log(data.toString())
        });
          
        proc.on('close', (code) => {
            console.log(`Image Creation done with code ${code}`);
        });
        return {"status" : true}
    },

    /**
     * 
     * @param {string} path 
     * @param {string} token
     */
    getFiles : function(path, token, ip) {
        var retarr = [];
        if (!path.startsWith(index.VideoPath))
            path = index.VideoPath + Path.sep + path;

        fs.readdirSync(path).forEach(file => {
            if (!path.startsWith(index.VideoPath)) {
                console.log( "Jemand hat versucht unerlaubt Datein zu durchsuchen!" )
                return;
            }
            if (fs.lstatSync(path + Path.sep + file).isFile())
                if (!index.VideoNameExtensions.includes(file.split(".")[file.split(".").length - 1]))
                    return;
            
            if (fs.lstatSync(path + Path.sep + file).isDirectory())
                if (!fs.existsSync(path + Path.sep + file + ".jpg"))
                    return;
            var split = file.split(".");
            var pa = path.replace(index.VideoPath, "") + Path.sep;
            var name = index.VideoNameExtensions.includes(split[split.length - 1]) ? name = file.substring(0, file.length - (split[split.length - 1].length + 1)).replace(" [1080p]", "") : file;

            var push = {
                "name" : name,
                "Path" : pa + file,
                "type" : fs.lstatSync(path + Path.sep + file).isDirectory() ? "folder" : "video",
                "image" : fs.lstatSync(path + Path.sep + file).isDirectory() ? pa + file + ".jpg" : pa + file.replace(split[split.length - 1], "jpg")
            }

            if (push["type"] === "video") 
                push["timeStemp"] = this.loadTime(path + Path.sep + file, token, ip)

            retarr.push(push);
        })
        return retarr;
    },

    /**
     * @param {string} path 
     * @param {string} token 
     */
    loadTime : function(path, token, ip) {

        if (!path.startsWith(index.VideoPath))
            path = index.VideoPath + path
        loginBackend.getUserFromToken(token, ip).then(user => {
            var data = getData();
            if (!user["status"])
                return -1
            user = user["user"];
            if (data.hasOwnProperty(user["username"])) {
                if (data[user["username"]].hasOwnProperty(path)) {
                    return data[user["username"]][path];
                } else {
                    return 0 
                }
            } else {
                return 0
            }
        })

    },
    /**
     * 
     * @param {string} path 
     * @param {string} token 
     * @param {number} percent 
     */
    saveTime : function (path, token, percent, ip) {
        if (!path.startsWith(index.VideoPath))
            path = index.VideoPath + path;
        var data = getData()
        var user = this.getUserFromToken(token, ip)
        if (!data.hasOwnProperty(user["username"])) 
            data[user["username"]] = {};
        data[user["username"]][path] = percent
        saveData(data)
    },

    /**
     * @param {string} path 
     */
    getFileData : function(path) {

        path = path.substring(3, path.length)

        if (!path.startsWith(index.VideoPath))
            path = index.VideoPath + Path.sep + path
        var ret = {}

        var skips = loadSkips();
        if (skips.hasOwnProperty(path))
            ret["skip"] = skips[path]
        else 
            ret["skip"] = {
                "startTime" : -1,
                "stopTime" : -1
            }

        var split = path.split("\\");
        var string = split[split.length - 1].substring((split[split.length - 1].indexOf("-") + 2));
        var number

        if (string.substring(0, 3).match("^[0-9]+$"))
            number = parseInt(string.substring(0, 3), 10)
        if (string.substring(0, 2).match("^[0-9]+$"))
            number = parseInt(string.substring(0, 2), 10)
        var newNumber = number+1;
        if (number < 10)
            number = "0" + number
        if (newNumber < 10)
            newNumber = "0" + newNumber;
        split[split.length - 1] = split[split.length - 1].replace(number, newNumber)
        if (fs.existsSync(split.join("\\")))
            ret["next"] = split.join("\\").replace(index.VideoPath, "")
        if (!isEmptyObject(ret))
            return ret;
        else 
            return null;
    },

    getUserData: function(token, ip) {
        loginBackend.getUserFromToken(token, ip).then(user => {
            console.log(user)
            if (!user["status"])
                return user;
            user = user["user"]
            var settings = loadSettings()
            var ret = {};
    
            if (user !== null && settings.hasOwnProperty(user["username"])) {
                ret["volume"] = settings[user["username"]]["volume"]
            } else {
                ret["volume"] = settings["default"]["volume"];
            }
    
            return {"status" : true, "data" : ret};
        })
    },

    saveUserData: function(token, ip, data) {
        loginBackend.getUserFromToken(token, ip).then(user => {
            var settings = loadSettings();
    
            settings[user["user"]["username"]] = data;
    
            saveSettings(settings);
            return {"status" : true}
        })
    },

    shutdown: function() {
        process.exit(0)
    }
}

function loadSettings() {
    try {
        return JSON.parse(fs.readFileSync(Path.join(index.path, "data", "settings.json")))
    } catch (err) {
        if (index.test) {
            return {}
        } else 
            throw err;
    }
}

function saveSettings(settings) {
    fs.writeFileSync(Path.join(index.path, "data", "settings.json"), JSON.stringify(settings, null, 4))
}

function getData() {
    try {
        return JSON.parse(fs.readFileSync(index.path + "/data/status.json"));
    } catch (err) {
        if (index.test) {
            return {}
        } else 
            throw err;
    }
}

function saveData(data) {
    try {
        fs.writeFileSync(index.path + "/data/status.json", JSON.stringify(data, null, 4))
    } catch (err) {
        if (index.test) {
            return {}
        } else 
            throw err;
    }
}
function loadSkips() {
    try {
        return JSON.parse(fs.readFileSync(index.path + "/data/intros.json"));
    } catch (err) {
        if (index.test) {
            return {}
        } else 
            throw err;
    }
}

function isEmptyObject(obj) {
    return !Object.keys(obj).length;
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}