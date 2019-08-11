const fs = require('fs');
const filePath = 'app/data/datastore.json';

const sendDataToModel = (filename) => {
    const data = JSON.parse(fs.readFileSync(filePath));
    const index = data.findIndex(el => el.filename === filename);
    if (index !== -1) {
        data[index].count++;
        data[index].time = new Date();
    } else {
        data.push({filename: filename, count: 1, time: new Date()});
    }
    fs.writeFileSync(filePath, JSON.stringify(data));
};

const transformJSONDataToHTML = () => {
    const data = JSON.parse(fs.readFileSync(filePath));
    let innerData = '';
    Array.prototype.forEach.call(data, el => {
        innerData += `<div><span>Filename: ${el.filename} </span><span>Count: ${el.count} </span><span>Time: ${el.time}</span></div>`
    });
    return innerData
};

module.exports.sendDataToModel = sendDataToModel;
module.exports.transformJSONDataToHTML = transformJSONDataToHTML;
