const http = require("http");
const os = require("os");

const allReady2CS = (myRequests) => {
  if (myRequests.length) {
    let _responseAll = true;
    for (let i = 0; i < myRequests.length; i++) {
      const _element = myRequests[i];
      if (_element.status !== 1) {
        _responseAll = false;
        break;
      }
    }
    return _responseAll;
  }
  return false;
};

// gui yeu cau vao mien gang toi tat ca cac host khac
// path: /cs-request?timestamp=${_timestamp}
// return const _request = {
//   hostname: hostname,
//   timestamp: _timestamp,
//   status: 0
// }
const sendRequest2CS2Host = (hostname) => {
  const _timestamp = Date.now();

  const _request = {
    hostname: hostname,
    timestamp: _timestamp,
    status: 0,
  };

  const _options = {
    hostname: hostname,
    port: 8080,
    path: `/cs-request?timestamp=${_timestamp}`,
  };

  const req = http.request(_options, (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {});
  });

  req.on("error", (error) => {
    console.error(`Error: ${error.message}`);
  });

  req.end();

  return _request;
};

const sendRequest2AllServer = (myIP, serverList) => {
  const _requests = [];
  for (let i = 0; i < serverList.length; i++) {
    const _host = serverList[i].hostname;
    if (_host == myIP) continue;
    const _request = sendRequest2CS2Host(_host);
    _requests.push(_request);
  }
  return _requests;
};

const updateMyRequest = (myRequest, hostname) => {
  for (let i = 0; i < myRequest.length; i++) {
    if (myRequest[i].hostname == hostname) {
      myRequest[i].status = 1;
    }
  }
};

const getMyIp = () => {
  const interfaces = os.networkInterfaces();

  for (const interfaceName in interfaces) {
    for (const addressInfo of interfaces[interfaceName]) {
      if (addressInfo.family === "IPv4" && !addressInfo.internal) {
        return addressInfo.address;
      }
    }
  }

  return "Unknown";
};

exports.allReady2CS = allReady2CS;
exports.sendRequest2CS2Host = sendRequest2CS2Host;
exports.updateMyRequest = updateMyRequest;
exports.getMyIp = getMyIp;
exports.sendRequest2AllServer = sendRequest2AllServer;
