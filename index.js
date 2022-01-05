const commandLineArgs = require('command-line-args'),
    commandLineUsage = require('command-line-usage'),
    https = require('https'),
    colors = require('colors'),
    { Worker } = require('worker_threads'),
    { readSetting, writeSetting } = require('./setting'),
    config = require('./config'),
    help = require('./help');

const args = commandLineArgs(help.arg_opts);

let setting = readSetting(config.miner.settings);

const startMining = (setting, config) => {
    const req = https.request(config.server, (res) => {
        res.setEncoding('utf8');
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        res.on('end', () => {
            const json = JSON.parse(data);
            if (json.success === true) {
                const workerData = {
                    name: json.name,
                    ip: json.ip,
                    port: json.port,
                    encoding: config.socket.encoding,
                    timeout: config.socket.timeout,
                    config,
                    setting
                };
                console.log(`Pool: ${json.name}, IP: ${json.ip}, Port: ${json.port}`);
                let pool = [];
                for (let w = 0; w < setting.threads; w++) {
                    const worker = new Worker(`${__dirname}/miner.js`, { workerData });
                    worker.on('message', res => {
                        let report = `#${res.thread} | Difficulty: ${res.range.toString().padStart(10)} | `;
                        report += `Hashrate: ${res.hashrate.padStart(12)} | Compute: ${res.compute.padStart(10)} | `;
                        report += `Ping: ${res.ping.padStart(10)} | `;
                        if (res.result === 'GOOD') {
                            report += colors.green(res.result);
                        } else if (res.result === 'BAD') {
                            report += colors.red(res.result);
                        } else if (res.result === 'BLOCK') {
                            report += colors.blue(res.result);
                        }
                        console.log(report);
                    });
                    pool.push(worker);
                }
            } else {
                console.error(`Error, could not get pool:\n${data}`);
            }
        });
    });
    req.on('error', (e) => {
        console.error(`Request error: ${e.message}`);
    });
    req.end();
}

const getBalance = (config, user) => {
    return new Promise((resolve, reject) => {
        config.server.path = `/users/${user}`;
        const req = https.request(config.server, (res) => {
            res.setEncoding('utf8');
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                const json = JSON.parse(data);
                resolve(json.result.balance.balance);
            });
        });
        req.on('error', (e) => {
            reject(`Request error: ${e.message}`);
        });
        req.end();
    });
}

if (args.help || (!setting.user && !args.user)) {
    console.log(commandLineUsage(help.sections));
} else if (args.version) {
    console.log(` Version: ${config.miner.version}`);
} else if (args.wallet && (setting.user || args.user)) {
    getBalance(config, (setting.user ? setting.user : args.user))
        .then(res => {
            console.log(` Balance: ${res}`);
        }, error => {
            console.error(error);
        });
} else {
    if (args.user) setting.user = args.user;
    if (args.threads) setting.threads = args.threads;
    if (args.miner) setting.miner = args.miner;
    if (args.difficulty) {
        if ((help.valid_diffs.indexOf(args.difficulty) >= 0)) {
            setting.difficulty = args.difficulty;
        } else {
            console.log(`Value may be: ${valid_diffs}`);
            return;
        }
    }
    writeSetting(config.miner.settings, setting);
    startMining(setting, config);
}