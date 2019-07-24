const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');
const port = '8080';

const requestHandler = (req, res) => {

    res.setHeader("Content-Type", "text/html; charset=utf-8;");

    let urlText = req.url.split('/')[2];
    const dataPath = 'app/data/';
    let filePath, readStream;

    switch (req.url) {
        case '/ping':
            res.statusCode = 200;
            res.end();
            break;
        case '/':
            res.end('Go sleep');
            break;
        case '/locale':
            res.end('Треба спать');
            break;
        case `/echo-query/${urlText}`:
            res.end(urlText);
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
        case `/files/${urlText}`:
            const type = urlText.match(/[^.]*$/)[0];
            if (type === 'txt' || type === 'html' || type === '') {
                if (type === '') {
                    urlText = 'index.html'
                }
                filePath = path.join(__dirname, dataPath, urlText);
                fs.readFile(filePath, {encoding: 'utf-8'}, (err, data) => {
                    if (!err) {
                        res.end(data);
                    } else {
                        console.log('Error of reading file', err);
                        res.end(err);
                    }
                });
            } else if (type === 'mp3' || type === 'mp4') {
                filePath = path.join(__dirname, dataPath, urlText);
                readStream = fs.createReadStream(filePath);
                readStream.on('open', function () {
                    readStream.pipe(res);
                });
                readStream.on('error', function(err) {
                    res.end(err);
                });
            }
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
