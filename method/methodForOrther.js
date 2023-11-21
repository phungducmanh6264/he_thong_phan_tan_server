const http = require("http");

const addRequest = (requestList, { hostname, timestamp }) => {
  requestList.push({ hostname, timestamp });
  requestList.sort(function (a, b) {
    return a.timestamp - b.timestamp;
  });
};

const responseRequest = (hostname) => {
  const _hostname = hostname;
  const options = {
    hostname: _hostname,
    port: 8080,
    path: "/cs-response",
    method: "GET",
  };

  const req = http.request(options, (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      console.log(`sended response to: ${_hostname}`);
    });
  });

  req.on("error", (error) => {
    console.error(`Error: ${error.message}`);
  });

  req.end();
};

const responseAllOrtherRequest = (requests) => {
  for (let i = 0; i < requests.length; i++) {
    const _request = requests[i];
    if (_request.status === 0) {
      const _hostname = _request["hostname"];
      responseRequest(_hostname);
      requests[i].status = 1;
    }
  }

  return requests;
};

exports.addRequest = addRequest;
exports.responseRequest = responseRequest;
exports.responseAllOrtherRequest = responseAllOrtherRequest;
