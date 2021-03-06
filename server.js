const fs = require("fs");
const WebSocket = require("ws");
const path = require("path");
const crypto = require("crypto");
const http = require("http");

var virtualdir;
var send;

module.exports.start = function (opts) {

    //formalize the keys of proxies
    var proxies = {};
    for(key in opts.proxy) {
        var newKey = key;
        if(key.startsWith("/")) {
            newKey = key.replace("/", "")
        }
        proxies[newKey] = opts.proxy[key];
    }

    function getAllFiles(dirname) {
        var dir = {};
        fs.readdirSync(dirname).forEach(uri => {
            if (fs.statSync(path.join(dirname, uri)).isFile()) {
                dir[uri] = fs.readFileSync(path.join(dirname, uri));
            } else {
                var subdir = getAllFiles(path.join(dirname, uri));
                for (key in subdir) {
                    dir[uri+"/"+key] = subdir[key];
                }
            }
        })

        return dir;
    }

    virtualdir = getAllFiles(opts.dir);

    var server = http.createServer((req, res) => {
        const baseUrl = req.url.replace("/", "");

        for(proxy in proxies) {
            if(baseUrl.startsWith(proxy)) {
                
                var h = proxies[proxy].split("/");
                if(!h[1]) {
                    h[1] = "/"
                } else {
                    h[1] = "/" + h[1];
                }

                var split = h[0].split(":");
                if(split.length === 1) {
                    split[1] = 80;
                } else {
                    split[1] = Number(split[1]);
                }

                const options = {
                    host: split[0],
                    port: split[1],
                    method: req.method,
                    path: (h[1] + baseUrl.replace(proxy, "")).replace(/\/\//g, "/"),
                    headers: req.headers
                }

                var proxyReq = http.request(options, function (r) {
                    res.writeHead(r.statusCode, r.headers)
                    r.pipe(res, {end: true})
                })

                req.pipe(proxyReq, {end: true})

                return;
            }
        }

        const url = baseUrl.replace(/\[#?].*$/, "");
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
        w.clients.forEach(c => c.send(data ? JSON.stringify(data) : ""))
    }

    server.listen(opts.port);
};

var updated = {};

function genHash(file) {
    return crypto.createHash("md5").update(file).digest("hex");
}

module.exports.update = (filename, content) => {
    const ext = path.extname(filename).replace(".", "");

    const hash = genHash(content);
    if (updated[filename] === hash) return;
    updated[filename] = hash;

    if (!virtualdir[filename] || virtualdir[filename] !== content) {
        //the file is either new or it has updated
        virtualdir[filename] = content;
        
        switch (ext) {
            case "css":
                send({
                    type: ext,
                    filename,
                    data: content.toString()
                });
                break;
            
            default:
                send();
                break;
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
