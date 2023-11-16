const http = require('http');
const { hostname } = require('os');
const url = require('url');


const my_requests = [];
const orther_requests = [];
// 0 ko lam gi 1 Muon vao mien gang 2 dang o trong mien gang
let status = 0;
let listServer = ['127.0.0.1'];

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
      console.log(`sended response to: ${hostname}` );
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
  status = 2;

}

const raMienGang = () => {
  for (let i = 0; i < orther_requests.length; i++) {
    const element = orther_requests[i];
    const hostname = element.hostname;
    sendResponse(hostname);
  }
  status = 0;
}

// Khi gui request thi them doi tuong vao mang requests {hostname, status: 0}
// khi nhan duoc response thi doi status thanh 1
const sendRequest2Host = (hostname) => {
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
  status = 1;
  listServer.forEach(element => {
    sendRequest2Host(element);
  });
}


http.createServer(function (req, res) {
  // Lấy đường dẫn của request từ thuộc tính url
  const requestUrl = req.url;

  // Phân giải đường dẫn của request
  const urlObject = url.parse(requestUrl, true);
  const pathName = urlObject.pathname;

  const hostname = req.hostname;

  switch (pathName) {
    case "/send-requests":
    {
      sendRequestAll();
      break;
    }
    case "/cs-request":
    {
      if(status === 0){
        sendResponse(hostname);
      }
      else{
        addOrtherRequest(hostname);
      }
      res.end("");
      break;
    }
    case "/cs-response":
    {
      for (let i = 0; i < my_requests.length; i++) {
        const element = my_requests[i];
        if (element.hostname === hostname) {
          my_requests[i].status = 1;
          break;
        }
      }

      if (isResponseAll()) {
        vaoMienGang();
      }

      res.end("");
      break;
    }

    default:
      break;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World!');
}).listen(8080);