const server = require("./server");

module.exports = ( opts = { dir:"public", port:3000, host:"localhost", index:"index.html" } ) => {
    var clientCode = require("fs").readFileSync(require.resolve("./client/client.js", "utf-8")).toString().replace("%port%", opts.port).replace("%host%", opts.host);

    server.start(opts);

    return {
        name: "devsuite",
        banner() {
            return clientCode;
        },

        writeBundle(_, bundle) {
            for(file in bundle) {
                if(bundle[file].type === "chunk") {
                    server.update(file, bundle[file].code);

                    //console.log(bundle[file].map);
                    //for(x in bundle[file].map) {console.log(x)};

                    if(bundle[file].map) {
                       server.update(file + ".map", bundle[file].map.file); 
                    }

                } else if (bundle[file].type === "asset"){
                    server.update(file, bundle[file].source);
                }
            }
        }

    }
}