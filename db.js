const fs = require('fs');

const sendDataToModel = (filename) => {
    const filePath = 'app/data/datastore.json';
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

module.exports.sendDataToModel = sendDataToModel;
