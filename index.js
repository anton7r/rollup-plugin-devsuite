const server = require("./server");

module.exports = function devsuite(opts = { dir:"", port:3000, host:"localhost" }) {
    var clientCode = require("fs").readFileSync(require.resolve("./client/client.js", "utf-8")).toString().replace("%port%", opts.port).replace("%host%", opts.host);

    server.start(opts);

    return {
        name: "devsuite",
        banner() {
            return clientCode;
        },

    }
}