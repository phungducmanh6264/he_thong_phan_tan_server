const http = require('http');
const { hostname } = require('os');
const url = require('url');
const {InitDispatcherServerIP} = require('./dispatcher/index')

const my_requests = [];
const orther_requests = [];
// -1 la chua khoi tao 0 ko lam gi 1 Muon vao mien gang 2 dang o trong mien gang
let server_status = -1;
let listServer = [];
let IPDispatcherServer = "";

const REQ_SUCCESS = "1";
const REQ_FAILED = "0";
const REQ_ERROR = "-1";


const addOrtherRequest = ({ hostname, timestamp }) => {
  orther_requests.push({ hostname, timestamp });
  orther_requests.sort(function (a, b) {
    return a.timestamp - b.timestamp;
  });
}

const sendResponse = (hostname) => {
  const options = {
    hostname: hostname,
    port: 8080,
    path: '/cs-response',
    method: 'GET',
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log(`sended response to: ${hostname}`);
    });
  });

  req.on('error', (error) => {
    console.error(`Error: ${error.message}`);
  });

  req.end();
}

const isResponseAll = () => {
  if (my_requests.length === listServer.length) {
    let responseAll = true;
    for (let i = 0; i < my_requests.length; i++) {
      const element = my_requests[i];
      if (element.status !== 1) {
        responseAll = false;
        break;
      }
    }
    return responseAll;
  }
  return false;
}

const vaoMienGang = () => {
  server_status = 2;

}

const raMienGang = () => {
  for (let i = 0; i < orther_requests.length; i++) {
    const element = orther_requests[i];
    const hostname = element.hostname;
    sendResponse(hostname);
  }
  server_status = 0;
}

// Khi gui request thi them doi tuong vao mang requests {hostname, status: 0}
// khi nhan duoc response thi doi status thanh 1
const sendRequest2OrtherHost = (hostname) => {
  const options = {
    hostname: hostname,
    port: 8080,
    path: '/cs-request',
    method: 'GET',
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
    });
  });

  // Them request vao trong mang requests
  my_requests.push({
    hostname: hostname,
    status: 0
  })

  req.on('error', (error) => {
    console.error(`Error: ${error.message}`);
  });

  req.end();
}

const sendRequestAll = () => {
  server_status = 1;
  listServer.forEach(element => {
    sendRequest2OrtherHost(element);
  });
}

const initFromDispatcherServer = () => {
  if (!IPDispatcherServer) return false;
  const options = {
    hostname: hostname,
    port: 8888,
    path: '/init-server',
    method: 'GET',
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log(`sended response to: ${hostname}`);
    });
  });

  req.on('error', (error) => {
    console.error(`Error: ${error.message}`);
  });

  req.end();
}

const requestAllServerIPFromDispatcher = () => {
  if (!IPDispatcherServer) return false;
  const options = {
    hostname: IPDispatcherServer,
    port: 8888,
    path: '/get-all-ip',
    method: 'GET',
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      listServer = JSON.parse(data);
    });
  });

  req.on('error', (error) => {
    console.error(`Error: ${error.message}`);
  });

  req.end();
}


http.createServer(function (req, res) {
  // Lấy đường dẫn của request từ thuộc tính url
  const requestUrl = req.url;
  // Phân giải đường dẫn của request
  const urlObject = url.parse(requestUrl, true);
  const pathName = urlObject.pathname;
  const hostname = req.hostname;
  const query = urlObject.query;


  if (server_status === -1 && pathName !== "/set-dispatcher-server-ip" && pathName !== "/init-from-dispatcher" && pathName !== "/dispatcher-response-init-request") {
    res.end(REQ_ERROR);
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*'); // Cho phép tất cả các origin
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Trả về dữ liệu
  res.writeHead(200, { 'Content-Type': 'text/plain' });

  switch (pathName) {
    case "/get-server-info":{
      requestAllServerIPFromDispatcher();
      const _info = {
        server_status: server_status,
        list_ip_server : listServer,
        my_requests: my_requests,
        orther_requests : orther_requests
      }
      res.end(JSON.stringify(_info));
      break;
    }
    case "/init-from-dispatcher": {
      //from front end
      initFromDispatcherServer();
      res.end(REQ_SUCCESS);
      break;
    }
    case "/dispatcher-response-init-request": {
      //from dispatcher server
      server_status = 0;
      res.end(REQ_SUCCESS);
      break;
    }
    case "/set-dispatcher-server-ip":
      {
        
        try {
          const _ip = query.ip;
          IPDispatcherServer = _ip;
          res.end(REQ_SUCCESS);
        } catch (error) {
          res.end(REQ_FAILED);
        }
        break;
      }
    case "/get-all-server-ip":
      {
        console.log("GET ALL IP FROM SERVER: " + IPDispatcherServer);

        //from front end
        requestAllServerIPFromDispatcher();
        res.end(REQ_SUCCESS);
        break;
      }
    case "/send-requests":
      {
        //gui cac request khi muon vao mien gang
        sendRequestAll();
        break;
      }
    case "/cs-request":
      {
        //khi cac server khac gui yeu cau vao mien gang den server hien tai
        if (server_status === 0) {
          sendResponse(hostname);
        }
        else {
          addOrtherRequest(hostname);
        }
        res.end(REQ_SUCCESS);
        break;
      }
    case "/cs-response":
      {
        //cac server khac tra response ve cho server hien tai neu truoc do server hien tai yeu cau
        for (let i = 0; i < my_requests.length; i++) {
          const _element = my_requests[i];
          if (_element.hostname === hostname) {
            my_requests[i].status = 1;
            break;
          }
        }

        if (isResponseAll()) {
          vaoMienGang();
        }

        res.end(REQ_SUCCESS);
        break;
      }
    default: {
      res.end("100");
      break;
    }
  }
}).listen(8080);