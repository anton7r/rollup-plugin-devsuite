const fs = require("fs");
const WebSocket = require("ws");
const path = require("path");
const crypto = require("crypto");

module.exports.start = function(opts) {
    var pathDir = path.resolve(opts.dir);
    
    function getAllFiles(dirname) {
        var dir = {};
        var filepaths = fs.readdirSync(dirname);
        filepaths.forEach(filename => {
            if(fs.statSync(path.join(dirname, filename)).isFile()) {
                dir[filename] = fs.readFileSync(path.join(dirname, filename));
            } else {
                var subdir = getAllFiles(path.join(dirname, filename));
                for(key in subdir) {
                    dir[path.join(filename, key)] = subdir[key];
                }
            }
        })
    
        return dir;
    }
    
    var virtualdir = getAllFiles(opts.dir);

    var server = require("http").createServer((req, res) => {
        const url = req.url.replace("/", "").replace(/\?.*$/, "");
        var type = req.headers.accept.split(",")[0];
        
        if(type === "*/*" && path.extname(url) === ".js") {
            type = "application/javascript";
        }

        res.writeHead(200, {'Content-type':type});

        if(virtualdir[url]) res.end(virtualdir[url]);
        else res.end(virtualdir["index.html"]);
    }); 
    
    const w = new WebSocket.Server({ server });
    
    function send(data) {
        w.clients.forEach(c => c.send(data));
    }
    
    var updated = {};

    function genHash(file) {
        return crypto.createHash("md5").update(file).digest("hex");
    }
    
    fs.watch(pathDir + "/", { recursive: true }, (event, filePath) => {

        const ext = path.extname(filePath);
        const file = fs.readFileSync(path.join(pathDir, filePath));
        
        const hash = genHash(file);
        if(updated[filePath] === hash) return;
        updated[filePath] = hash;

        if(!virtualdir[filePath] || virtualdir[filePath] !== file){
            //the file is either new or it has updated
            virtualdir[filePath] = file;
            if(ext === ".css") {
                send(JSON.stringify({ type:"css", file:filePath }));
            } else if(ext === ".js") {
                //refresh
                send("");
            }
        }
    })
    
    server.listen(opts.port);
};