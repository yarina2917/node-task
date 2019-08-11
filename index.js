const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');
const querystring = require('querystring');
const zlib = require('zlib');
const port = '8080';
const db = require('./db');

const requestHandler = (req, res) => {

    let urlPath = req.url.split('/').slice(2).join('/');
    let filePath, readStream;
    const dataPath = 'app/data/';

    switch (req.url) {
        case '/ping':
            res.statusCode = 200;
            res.end();
            break;
        case '/':
            res.end('Go sleep');
            break;
        case '/locale':
            res.setHeader("Content-Type", "text/html; charset=utf-8;");
            res.end('Треба спать');
            break;
        case `/echo-query/${urlPath}`:
            res.end(urlPath);
            break;
        case '/echo-query':
            if (req.method === 'POST') {
                let body = '';
                req.on('data', chunk => {
                    body += chunk.toString();
                });
                req.on('end', () => {
                    console.log('body', body);
                });
            } else {
                console.log('Only post method is available');
            }
            res.end();
            break;
        case '/address':
            const interfaces = os.networkInterfaces();
            const IP = findIP(interfaces);
            console.log('IP', IP);
            console.log('Port', port);
            res.end();
            break;
        case '/error':
            res.statusCode = 500;
            res.end('Server Error');
            break;
        case `/files/${urlPath}`:
            let params = urlPath.split('/')[urlPath.split('/').length - 1].split('?');
            let fileName = params[0];
            const fileType = fileName.match(/[^.]*$/)[0];
            if (fileType === '') {
                urlPath = 'index.html'
            }
            if (params.length > 1) {
                urlPath = urlPath.replace(`?${params[1]}`, '');
                params = querystring.parse(params[1]);
            }
            filePath = path.join(__dirname, dataPath, urlPath);
            readStream = fs.createReadStream(filePath);

            if (params.download) {
                if (params.filename) {
                    res.setHeader("Content-Disposition", `attachment; filename=${params.filename}`);
                } else {
                    res.setHeader("Content-Disposition", `attachment;`);
                }
                if (params.compress) {
                    readStream.pipe(zlib.createGzip()).pipe(res);
                }
                db.sendDataToModel(fileName);
            }
            // TODO ask about error handling and about on open/error
            if (!params.download || params.download && !params.compress) {
                if (fileType === 'mp4') {
                    res.setHeader("Content-Type", "video/mp4");
                }
                readStream.on('open', () => {
                    readStream.pipe(res);
                });
                readStream.on('error', (err) => {
                    res.end(err);
                });
            }
            break;
        case '/stats':
            const statsData = db.transformJSONDataToHTML();
            res.setHeader("Content-Type", "text/html; charset=utf-8;");
            res.end(statsData);
            break;
        default:
            res.statusCode = 404;
            res.end('Not Found');
    }

};

const findIP = (ifaces) => {
    const addresses = [];
    Object.keys(ifaces).forEach( (ifname) => {
        ifaces[ifname].forEach( (iface) => {
            if (iface.family === 'IPv4' && !iface.internal) {
                addresses.push(iface.address);
            }
        });
    });
    return addresses
};


http.createServer(requestHandler).listen(port, () => {
    console.log(`server is listening on ${port}`)
});
