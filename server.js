const fs = require("fs");
const WebSocket = require("ws");
const path = require("path");
const crypto = require("crypto");

var virtualdir;
var send;

module.exports.start = function (opts) {

    function getAllFiles(dirname) {
        var dir = {};
        var filepaths = fs.readdirSync(dirname);
        filepaths.forEach(filename => {
            if (fs.statSync(path.join(dirname, filename)).isFile()) {
                dir[filename] = fs.readFileSync(path.join(dirname, filename));
            } else {
                var subdir = getAllFiles(path.join(dirname, filename));
                for (key in subdir) {
                    dir[path.join(filename, key)] = subdir[key];
                }
            }
        })

        return dir;
    }

    virtualdir = getAllFiles(opts.dir);

    var server = require("http").createServer((req, res) => {
        const url = req.url.replace("/", "").replace(/\?.*$/, "");
        var type = req.headers.accept.split(",")[0];

        if (path.extname(url) === ".js") {
            type = "application/javascript";
        }

        res.writeHead(200, {
            'Content-type': type
        });

        if (virtualdir[url]) {
            res.end(virtualdir[url]);
        } else {
            var indexFile = virtualdir[opts.index]

            if (indexFile) {
                res.end(indexFile);
            } else {
                res.end(getError("indexNotFound"))
            }
        }
    });

    const w = new WebSocket.Server({
        server
    });

    send = data => {
        w.clients.forEach(c => c.send(data))
    }

    server.listen(opts.port);
};

var updated = {};

function genHash(file) {
    return crypto.createHash("md5").update(file).digest("hex");
}

module.exports.update = (filename, content) => {
    const ext = path.extname(filename);

    const hash = genHash(content);
    if (updated[filename] === hash) return;
    updated[filename] = hash;

    if (!virtualdir[filename] || virtualdir[filename] !== content) {
        //the file is either new or it has updated
        virtualdir[filename] = content;
        if (ext === ".css") {
            send(JSON.stringify({
                type: "css",
                file: filename
            }));
        } else if (ext === ".js") {
            //refresh
            send("");
        }
    }
}

var errorpages = {};
var errorcss;

const getError = errorFile => {
    var page = errorpages[errorFile]
    if (page) {
        return page;
    } else {

        if (!errorcss) {
            errorcss = "<style>" + fs.readFileSync(require.resolve("./errors/errors.css"), "utf-8").replace(/[ \n\r]/g, "") + "</style>";
        }

        errorpages[errorFile] = fs.readFileSync(require.resolve("./errors/" + errorFile + ".html"), "utf-8").replace("%css%", errorcss);
        return errorpages[errorFile];
    }
}