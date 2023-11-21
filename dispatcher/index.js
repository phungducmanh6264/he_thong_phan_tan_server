const { sendHttpRequestPromise } = require("../utils/index");

const initServer = (ipDispatcher) => {
  const _options = {
    hostname: ipDispatcher,
    port: 8888,
    path: "/init-server",
    method: "GET",
  };

  return sendHttpRequestPromise(_options);
};

const getAllServerIp = (ipDispatcher, myStatus) => {
  const _options = {
    hostname: ipDispatcher,
    port: 8888,
    path: `/get-all-ip?status=${myStatus}`,
    method: "GET",
  };

  return sendHttpRequestPromise(_options);
};

const TestConnect2DispatcherHost = (ipDispatcher) => {
  const _options = {
    hostname: ipDispatcher,
    path: `/test-connect`,
    method: "GET",
    port: 8888,
  };

  return sendHttpRequestPromise(_options);
};

exports.initServer = initServer;
exports.getAllServerIp = getAllServerIp;
exports.TestConnect2DispatcherHost = TestConnect2DispatcherHost;
