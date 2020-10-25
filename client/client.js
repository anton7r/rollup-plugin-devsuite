/* 
 *   devsuite
 *   client.js
 */

(function() {
    //only one devsuite should be running per browsing session
    if(window.__devsuite__) return;

    function normalizeUrl(url) {
        return url.replace(location.origin + "/", "").replace(/\?.*$/, "");
    }

    var port = "%port%";
    var host = "%host%";
    
    function onMessage(e) {
        const data = e.data;
        if (data === "") {
            return location.reload();
        }
        var update = JSON.parse(data);
        update.data = update.data;
        var wasFound = false;

        switch (update.type) {
            case "css":

                function cssSuccess(el) {
                    wasFound = true;
                    const styles = document.createElement("style");
                    styles.setAttribute("_url", update.filename);
                    styles.innerHTML = update.data
                    el.parentElement.insertAdjacentElement("beforeend", styles);
                    el.parentElement.removeChild(el);
                }
                for (let i = 0; i < document.head.children.length; i++) {
                    const el = document.head.children[i];

                    if (el.localName === "link" && el.rel === "stylesheet") {
                        if (normalizeUrl(el.href) === update.filename) {
                            cssSuccess(el);
                            break;
                        }
                    } else if (el.localName === "style" && el.getAttribute("_url") === update.filename) {
                        cssSuccess(el);
                        break;
                    }
                }
                
                break;
            default:
                throw new Error(update.type + "is a unhandled case")
        }

        if (!wasFound) location.reload();
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

    window.__devsuite__ = true;
})();
/* end of client.js */