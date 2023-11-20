const http = require("http");
const url = require("url");
const {
  getAllServerIp,
  initServer,
  TestConnect2DispatcherHost,
} = require("./dispatcher/index");
const { addRequest, responseRequest } = require("./method/methodForOrther");
const {
  updateMyRequest,
  allReady2CS,
  sendRequest2AllServer,
} = require("./method/methodForMe");
const { GetIPOnLan } = require("./utils/netMethod");

// {hostname, timestamp, status}
// status
// 0 đã gửi đi
// 1 đã được phản hồi
let myRequests = [];
let ortherRequests = [];

// -1 chưa init
// 0 đang rảnh
// 1 đang yêu cầu và miền găng
// 2 đang ở trong miền găng
let serverStatus = -1;
let ipDispatcherServer = "";
let ipAllServer = [];
const ipOnLan = GetIPOnLan();

const REQ_FAILED = "failed";
const REQ_SUCCESS = "success";

http
  .createServer(function (req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*"); // Cho phép tất cả các origin
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.writeHead(200, { "Content-Type": "text/plain" });

    const _url = req.url;
    const urlObject = url.parse(_url, true);
    const pathName = urlObject.pathname;
    const hostname = req.socket.remoteAddress;
    const query = urlObject.query;

    if (
      serverStatus === -1 &&
      pathName !== "/set-dispatcher-server-ip" &&
      pathName !== "/init-server" &&
      pathName !== "/get-info"
    ) {
      res.end(REQ_FAILED);
      return;
    }

    switch (pathName) {
      // init this server to dispatcher +++ step1
      case "/init-server": {
        try {
          const _dispatcherIp = query.ip;
          TestConnect2DispatcherHost(_dispatcherIp)
            .then((r) => {
              initServer(_dispatcherIp)
                .then((r) => {
                  res.end(REQ_SUCCESS);
                })
                .catch((e) => {
                  res.end(REQ_FAILED);
                });
            })
            .catch((e) => {
              res.end(REQ_FAILED);
            });
        } catch (error) {
          res.end(REQ_FAILED);
        }
        break;
      }
      // get all server ip info
      case "/get-info": {
        getAllServerIp(ipDispatcherServer)
          .then((r) => {
            ipAllServer = JSON.parse(r);
            const _info = {
              serverIp: ipOnLan,
              serverStatus: serverStatus,
              ipAllServer: ipAllServer,
              myRequests: myRequests,
              ortherRequests: ortherRequests,
            };
            res.end(JSON.stringify(_info));
          })
          .catch((e) => {
            res.end(REQ_FAILED);
          });
        break;
      }
      case "/send-request": {
        serverStatus = 1;
        myRequests = sendRequest2AllServer(ipAllServer);
        res.end(REQ_SUCCESS);
        break;
      }
      case "/cs-exit": {
        serverStatus = 0;
        responseAllOrtherRequest(ortherRequests);
        break;
      }
      // xử lý các request được gửi đến
      case "/cs-request": {
        // `/cs-request?timestamp=${_timestamp}`
        const _timestamp = query.timestamp;
        const _hostname = hostname;

        if (serverStatus === -1) res.end(REQ_FAILED);

        if (serverStatus === 0) {
          responseRequest(_hostname);
          res.end(REQ_SUCCESS);
        } else {
          addRequest(ortherRequests, { _hostname, _timestamp });
          res.end(REQ_SUCCESS);
        }
        break;
      }
      // xử lý khi được response 1 request
      case "/cs-response": {
        const _hostname = hostname;
        updateMyRequest(myRequests, _hostname);
        if (allReady2CS(myRequests, ipAllServer)) {
          serverStatus = 2;
        }
        res.end(REQ_SUCCESS);
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
