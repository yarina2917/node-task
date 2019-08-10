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
            // TODO make variables split better
            let params = urlPath.split('/')[urlPath.split('/').length - 1].split('?');
            if (params.length > 1) {
                urlPath = urlPath.split('?')[0];
                params = querystring.parse(params[1]);
            }
            const type = urlPath.match(/[^.]*$/)[0];
            if (type === '') {
                urlPath = 'index.html'
            }
            filePath = path.join(__dirname, dataPath, urlPath);
            let fileName = filePath.split('/')[filePath.split('/').length - 1];
            readStream = fs.createReadStream(filePath);

            if (params.download) {
                db.sendDataToModel(fileName);
                if (params.filename) {
                    fileName = params.filename;
                }
                res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
                if (params.compress) {
                    readStream.pipe(zlib.createGzip()).pipe(res);
                }
            }
            // TODO ask about error handling and about on open/error
            if (!params.download || params.download && !params.compress) {
                if (type === 'mp4') {
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
            // TODO show data in browser
            const data = JSON.parse(fs.readFileSync('app/data/datastore.json'));
            console.log('DATASTORE', data);
            res.end();
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
