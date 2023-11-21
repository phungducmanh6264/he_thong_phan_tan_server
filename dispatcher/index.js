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

const getAllServerIp = (ipDispatcher) => {
  const _options = {
    hostname: ipDispatcher,
    port: 8888,
    path: "/get-all-ip",
    method: "GET",
  };

  return sendHttpRequestPromise(_options);
};

const TestConnect2DispatcherHost = (ipDispatcher) => {
  const _options = {
    hostname: ipDispatcher,
    path: "/test-connect",
    method: "GET",
    port: 8888,
  };

  return sendHttpRequestPromise(_options);
};

const setServerStatus = (ipDispatcher, status) => {
  const _options = {
    hostname: ipDispatcher,
    port: 8888,
    path: `/status-server?status=${status}`,
    method: "GET",
  };

  return sendHttpRequestPromise(_options);
};

exports.initServer = initServer;
exports.getAllServerIp = getAllServerIp;
exports.TestConnect2DispatcherHost = TestConnect2DispatcherHost;
exports.setServerStatus = setServerStatus;
