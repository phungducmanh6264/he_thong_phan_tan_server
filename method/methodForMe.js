const allReady2CS = (myRequests, ipAllServer) => {
  if (myRequests.length === ipAllServer.length) {
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
}

// gui yeu cau vao mien gang toi tat ca cac host khac
  // path: /cs-request?timestamp=${_timestamp}
    // return const _request = {
    //   hostname: hostname,
    //   timestamp: _timestamp,
    //   status: 0
    // }
const sendRequest2CS = (hostname) => {

  const _timestamp = Date.now();

  const _request = {
    hostname: hostname,
    timestamp: _timestamp,
    status: 0
  }

  const _options = {
    hostname: hostname,
    port: 8080,
    path: `/cs-request?timestamp=${_timestamp}`,
  };


  const req = http.request(_options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
    });
  });

  req.on('error', (error) => {
    console.error(`Error: ${error.message}`);
  });

  req.end();

  return _request;
}




exports.allReady2CS = allReady2CS;
exports.sendRequest2CS = sendRequest2CS;
