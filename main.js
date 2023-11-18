const http = require("http");
const url = require("url");
const {
  InitDispatcherServerIP,
  getAllServerIp,
} = require("./dispatcher/index");

let myRequests = [];
let ortherRequests = [];

let serverStatus = -1;
let ipDispatcherServer = "";
let ipAllServer = [];

const REQ_FAILED = "failed";
const REQ_SUCCESS = "success";

http
  .createServer(function (req, res) {
    const url = req.url;
    const urlObject = url.parse(url, true);
    const pathName = urlObject.pathname;
    const hostname = req.hostname;
    const query = urlObject.query;

    if (
      serverStatus === -1 &&
      pathName !== "/set-dispatcher-server-ip" &&
      pathName !== "/init-server"
    ) {
      res.end(REQ_FAILED);
      return;
    }

    res.setHeader("Access-Control-Allow-Origin", "*"); // Cho phép tất cả các origin
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.writeHead(200, { "Content-Type": "text/plain" });

    switch (pathName) {
      // init this server to dispatcher +++ step1
      case "/init-server": {
        try {
          const _dispatcherIp = query.ip;
          InitDispatcherServerIP(_dispatcherIp)
            .then((r) => {
              res.end(REQ_SUCCESS);
            })
            .catch((e) => {
              res.end(REQ_FAILED);
            });
        } catch (error) {
          res.end(REQ_FAILED);
        }
        break;
      }
      case "/get-si-info": {
        const _allServerIp = getAllServerIp();
        listServer = _allServerIp;
        const _info = {
          serverStatus: serverStatus,
          listServer: listServer,
          myRequests: myRequests,
          ortherRequests: ortherRequests,
        };
        res.end(JSON.stringify(_info));
        break;
      }
      /////////////////////////////////////////////
      default: {
        res.end("not found");
        break;
      }
    }
  })
  .listen(8080);
