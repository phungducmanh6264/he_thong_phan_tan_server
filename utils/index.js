const http = require("http");

const sendHttpRequestPromise = (options) => {
  return new Promise((resolve, reject) => {
    const req = http.get(options, (res) => {
      let data = "";

      // A chunk of data has been received.
      res.on("data", (chunk) => {
        data += chunk;
      });

      // The whole response has been received.
      res.on("end", () => {
        resolve(data);
      });
    });

    // Handle errors
    req.on("error", (error) => {
      reject(error);
    });
  });
};

const sendJsonRequest = (options, data, onSuccess, onFailed) => {
  const _dataString = JSON.stringify(data);
  options.method = "POST";
  options.headers = {
    "Content-Type": "application/json",
    "Content-Length": _dataString.length,
  };

  const req = http.request(options, (res) => {
    let data = "";

    // Nhận dữ liệu từ server
    res.on("data", (chunk) => {
      data += chunk;
    });

    // Xử lý khi kết thúc response
    res.on("end", () => {
      onSuccess(data);
    });
  });

  // Xử lý lỗi trong quá trình gửi request
  req.on("error", (error) => {
    onFailed(error);
  });

  // Gửi dữ liệu JSON qua request
  req.write(_dataString);

  req.end();
};

exports.sendHttpRequestPromise = sendHttpRequestPromise;
exports.sendJsonRequest = sendJsonRequest;
