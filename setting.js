const cpu = require('cpu'),
    fs = require('fs');

const checkSetting = (file) => {
    if (!fs.existsSync(file)) {
        const data = {
            threads: cpu.num(),
            difficulty: 'MEDIUM',
            miner: 'None'
        };
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
    }
}

const readSetting = (file) => {
    checkSetting(file);
    try {
        let rawdata = fs.readFileSync(file);
        return JSON.parse(rawdata);
    } catch {
        console.error('Settings read error');
    }
}

const writeSetting = (file, setting) => {
    checkSetting(file);
    fs.writeFileSync(file, JSON.stringify(setting, null, 2));
}

module.exports = {
    readSetting, writeSetting
}