const http = require("http");
const url = require("url");
const {
  getAllServerIp,
  initServer,
  TestConnect2DispatcherHost,
  setServerStatus,
} = require("./dispatcher/index");
const {
  addRequest,
  responseRequest,
  responseAllOrtherRequest,
} = require("./method/methodForOrther");
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
const myIpOnLan = GetIPOnLan();

const REQ_FAILED = "failed";
const REQ_SUCCESS = "success";

let statusWhenTestConnect = 1;

// setInterval(() => {
//   if (ipDispatcherServer) {
//     TestConnect2DispatcherHost(ipDispatcherServer)
//       .then((r) => {})
//       .catch((e) => {});
//   }
// }, 500);

http
  .createServer(function (req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*"); // Cho phép tất cả các origin
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.writeHead(200, { "Content-Type": "text/plain" });

    const _url = req.url;
    const urlObject = url.parse(_url, true);
    const pathName = urlObject.pathname;
    const hostname = req.socket.remoteAddress.replace("::ffff:", "");
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
        serverStatus = -1;
        myRequests = [];
        ortherRequests = [];
        try {
          const _dispatcherIp = query.ip;
          TestConnect2DispatcherHost(_dispatcherIp)
            .then((r) => {
              initServer(_dispatcherIp)
                .then((r) => {
                  serverStatus = 0;
                  ipDispatcherServer = _dispatcherIp;
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
        getAllServerIp(ipDispatcherServer, statusWhenTestConnect)
          .then((r) => {
            ipAllServer = JSON.parse(r);
            const _info = {
              serverIp: myIpOnLan,
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
        if (ipAllServer.length === 1) {
          serverStatus = 2;
        } else {
          myRequests = sendRequest2AllServer(myIpOnLan, ipAllServer);
        }
        res.end(REQ_SUCCESS);
        break;
      }
      case "/cs-exit": {
        serverStatus = 0;
        if (ortherRequests?.length > 0) {
          console.log(ortherRequests);
          ortherRequests = responseAllOrtherRequest(ortherRequests);
        }
        statusWhenTestConnect = 1;
        res.end(REQ_SUCCESS);
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
          ortherRequests.push({
            hostname: _hostname,
            timestamp: parseInt(_timestamp),
            status: 1,
          });
          res.end(REQ_SUCCESS);
        } else {
          ortherRequests.push({
            hostname: _hostname,
            timestamp: parseInt(_timestamp),
            status: 0,
          });
          res.end(REQ_SUCCESS);
        }
        break;
      }
      // xử lý khi được response 1 request
      case "/cs-response": {
        const _hostname = hostname;
        console.log(`response by ${_hostname}`);
        updateMyRequest(myRequests, _hostname);
        if (allReady2CS(myRequests, ipAllServer)) {
          serverStatus = 2;
          statusWhenTestConnect = 2;
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
