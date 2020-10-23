/* 
 *   devsuite
 *   client.js
 */
var port = "%port%";
var host = "%host%";

function onMessage(e) {
    const data = e.data;
    if (data === "") {
        return location.reload();
    }
    var update = JSON.parse(data);
    switch (update.type) {
        case "css":
            var wasFound = false;
            document.head.childNodes.forEach(el => {
                if (el.localName === "link" && el.rel === "stylesheet") {
                    var src = el.href.replace(location.origin + "/", "").replace(/\?.*$/, "");
                    console.log(src);

                    if (src == update.file && !wasFound) {
                        wasFound = true;
                        el.href = el.href + "?v=" + new Date().getTime();
                    }
                }
            })
            if (!wasFound) {
                location.reload();
            }

            break;
        default:
            throw new Error(update.type + "is a unhandled case")
    }
}

function onClose(params) {
    setTimeout(connect, 1000);
}

function connect() {
    var ws = new WebSocket("ws://" + host + ":" + port);
    ws.onmessage = onMessage;
    ws.onclose = onClose;
}

try {
    connect();
} catch (ignore) {}
/* end of client.js */