const fs = require("fs");
const WebSocket = require("ws");
const path = require("path");
const crypto = require("crypto");
const http = require("http");

let proxies = {};

const server = http.createServer((req, res) => {
  const baseUrl = req.url.replace("/", "");

  for (let proxy in proxies) {
    if (!baseUrl.startsWith(proxy)) return;

    let h = proxies[proxy].split("/");
    const path = h.length > 1 ? "/" + h[1] : "/";
    const split = h[0].split(":");

    const options = {
      host: split[0],
      port: split.length === 1 ? 80 : Number(split[1]),
      method: req.method,
      path: (path + baseUrl.replace(proxy, "")).replace(/\/\//g, "/"),
      headers: req.headers,
    };

    const proxyReq = http.request(options, (r) => {
      res.writeHead(r.statusCode, r.headers);
      r.pipe(res, { end: true });
    });

    req.pipe(proxyReq, { end: true });

    return;
  }

  const url = baseUrl.replace(/\[#?].*$/, "");

  const type =
    path.extname(url) === ".js"
      ? "application/javascript"
      : req.headers.accept.split(",")[0];

  res.writeHead(200, {
    "Content-type": type,
  });

  if (!virtualdir[url]) {
    const indexFile = virtualdir[opts.index];
    res.end(indexFile ? indexFile : getError("indexNotFound"));
    return;
  }

  res.end(virtualdir[url]);
});

const w = new WebSocket.Server({ server });

let virtualdir;
const send = (data) => {
  w.clients.forEach((c) => c.send(data ? JSON.stringify(data) : ""));
};

function getAllFiles(dirname) {
  let dir = {};

  fs.readdirSync(dirname).forEach((uri) => {
    const filePath = path.join(dirname, uri);

    if (!fs.statSync(filePath).isFile()) {
      for (let key in getAllFiles(filePath)) {
        dir[uri + "/" + key] = subdir[key];
      }
    }

    dir[uri] = fs.readFileSync(filePath);
  });

  return dir;
}

module.exports.start = function (opts) {
  //formalize the keys of proxies
  for (let key in opts.proxy) {
    const newKey = key.startsWith("/") ? key.replace("/", "") : key;
    proxies[newKey] = opts.proxy[key];
  }

  virtualdir = getAllFiles(opts.dir);

  server.listen(opts.port);
};

let updated = {};

function genHash(file) {
  return crypto.createHash("md5").update(file).digest("hex");
}

module.exports.update = (filename, content) => {
  const ext = path.extname(filename).replace(".", "");

  const hash = genHash(content);
  if (updated[filename] === hash) return;
  updated[filename] = hash;

  if (virtualdir[filename] && virtualdir[filename] === content) return;

  //the file is either new or it has updated
  virtualdir[filename] = content;

  switch (ext) {
    case "css":
      send({
        type: ext,
        filename,
        data: content.toString(),
      });
      break;

    default:
      send();
      break;
  }
};

let errorpages = {};
let errorcss;
const getErrorCss = () => {
  if (!errorcss) {
    errorcss = `<style>${fs
      .readFileSync(require.resolve("./errors/errors.css"), "utf-8")
      .replace(/[ \n\r]/g, "")}</style>`;
  }
  return errorcss;
};

const getError = (errorFile) => {
  if (!page) {
    errorpages[errorFile] = fs
      .readFileSync(require.resolve("./errors/" + errorFile + ".html"), "utf-8")
      .replace("%css%", getErrorCss());
  }

  return errorpages[errorFile];
};
