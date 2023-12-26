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
let myTimeStamp = 0;
const myIpOnLan = GetIPOnLan();

const REQ_FAILED = "failed";
const REQ_SUCCESS = "success";
//Trên dispatcher lúc đầu code để mã server không hoạt động là 0 trùng với mã status 0 rảnh của server nên thêm biến này
// để giải quyết
let statusWhenTestConnect = 1;

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

    //
    if (
      serverStatus === -1 &&
      pathName !== "/init-server" &&
      pathName !== "/get-info"
    ) {
      res.end(REQ_FAILED);
      return;
    }

    switch (pathName) {
      // init this server to dispatcher +++ step1
      // được gọi đầu tiền (Khi nhập ip dispatcher)
      case "/init-server": {
        //reset trạng thái
        serverStatus = -1;
        myRequests = [];
        ortherRequests = [];
        try {
          const _dispatcherIp = query.ip;
          // Gửi yêu cầu test connect đến dispatcher xem ip nhập có đúng k
          TestConnect2DispatcherHost(_dispatcherIp)
            .then((r) => {
              // Nếu ip dispatcher đúng thì init server với dispatcher
              initServer(_dispatcherIp)
                .then((r) => {
                  // Cập nhật trạng thái server khi init thành công
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
      // get all server ip info. Được gọi mỗi 1s khi người dùng đang dùng ứng dụng.
      // Thực hiện gửi request đến dispatcher để lấy thông tin các server khác
      case "/get-info": {
        getAllServerIp(ipDispatcherServer, statusWhenTestConnect)
          .then((r) => {
            ipAllServer = JSON.parse(r);
            // Khởi tạo thông tin để gửi về cho front end
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
      // Hàm được gọi khi người dùng nhấn yêu cầu vào miền găng
      case "/send-request": {
        // cập nhật trạng thái server là đang cần vào miền găng
        serverStatus = 1;
        // trong hệ thống hiện tại chỉ có 1 server duy nhất là server hiện tại thì cho vào miền găng luôn
        if (ipAllServer.length === 1) {
          serverStatus = 2;
        } else {
          // gửi request đến các server khác, hàm trả về danh sách các đối tượng request có các thuộc tính:
          // distination host name
          // timestamp (thời gian gửi request đến đó)
          // status (trạng thái của request mặc định là 0 là đã gửi và chưa được phản hồi)
          const _timestamp = Date.now();
          myTimeStamp = _timestamp;
          myRequests = sendRequest2AllServer(
            myIpOnLan,
            ipAllServer,
            myTimeStamp
          );
        }
        res.end(REQ_SUCCESS);
        break;
      }
      // Khi fe nhấn thoát miền găng
      case "/cs-exit": {
        // Cập nhật lại server status là đang rảnh (0)
        serverStatus = 0;
        // Kiểm tra và phản hồi lại các request của các server khác chưa được phản hồi
        if (ortherRequests?.length > 0) {
          console.log(ortherRequests);
          ortherRequests = responseAllOrtherRequest(ortherRequests);
        }
        statusWhenTestConnect = 1;
        res.end(REQ_SUCCESS);
        break;
      }
      // Khi có một server khác gửi request vào miền găng đến server hiện tại
      case "/cs-request": {
        // `/cs-request?timestamp=${_timestamp}`
        const _timestamp = query.timestamp;
        const _hostname = hostname;
        if (serverStatus === -1) res.end(REQ_FAILED);
        // Nếu server không yêu cầu vào miền găng
        // Hoặc server yêu cầu vào miền găng sau request đó thì server sẽ respone lại request vào miền găng đó
        if (
          serverStatus === 0 ||
          (serverStatus === 1 && myTimeStamp > _timestamp)
        ) {
          responseRequest(_hostname);
          ortherRequests.push({
            hostname: _hostname,
            timestamp: parseInt(_timestamp),
            status: 1,
          });
          res.end(REQ_SUCCESS);
        }
        // Nếu server đang trong miền găng
        // Hoặc là server đang yêu cầu vào miền găng và server gửi request trước cái này thì nó không response ngay mà thêm vào hàng đợi để response sau
        else {
          ortherRequests.push({
            hostname: _hostname,
            timestamp: parseInt(_timestamp),
            status: 0,
          });
          res.end(REQ_SUCCESS);
        }
        break;
      }
      // Khi server khác trả response cho serquest yêu cầu vào miền găng mà server này đã gửi
      case "/cs-response": {
        const _hostname = hostname;
        console.log(`response by ${_hostname}`);
        // Cập nhật lại trạng thái của request gửi đến server đó với status là 1, là đã được phản hồi
        updateMyRequest(myRequests, _hostname);
        // Kiểm tra xem tất cả các request đã được phản hồi hết chưa
        // Nếu rồi thì vào miền găng (set status là 2)
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
