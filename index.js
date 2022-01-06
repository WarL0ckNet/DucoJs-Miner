const commandLineArgs = require('command-line-args'),
    commandLineUsage = require('command-line-usage'),
    https = require('https'),
    colors = require('colors'),
    { Worker } = require('worker_threads'),
    { DateTime } = require('luxon'),
    { readSetting, writeSetting } = require('./setting'),
    config = require('./config'),
    help = require('./help'),
    { printReport, printPeriodicReport, showSettings,
        isValidMiningPool, addInvalidPool } = require('./utils');

const args = commandLineArgs(help.arg_opts);

let setting = readSetting(config.miner.settings),
    invalidPools = {},
    start_time = DateTime.now(),
    stat = {
        accepted: 0,
        rejected: 0,
        blocked: 0,
        total: 0,
        periodic: {
            last_report: start_time,
            hashes: 0,
            time: 0,
            count: 0
        }
    };

const getMiningPool = (config) => {
    return new Promise((resolve, reject) => {
        let attempt = 0;
        const handleError = (error) => {
            if (attempt < config.miner.max_attempts) {
                console.log(`Retrying in ${config.miner.timeout / 1000}s`);
                setTimeout(sendRequest(config), config.miner.timeout * 1000);
                attempt++;
            } else {
                reject(error);
            }
        }
        const sendRequest = (config) => {
            const req = https.request(config.server, (res) => {
                res.setEncoding('utf8');
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    const json = JSON.parse(data);
                    if (json.success === true) {
                        if (isValidMiningPool(invalidPools, json)) {
                            console.log(`Pool: ${json.name}, IP: ${json.ip}, Port: ${json.port} - ${colors.green('GOOD POOL')}`);
                            resolve(json);
                        } else {
                            console.error(`Pool: ${json.name}, IP: ${json.ip}, Port: ${json.port} - ${colors.red('BAD POOL')}`);
                            handleError('Bad pool');
                        }
                    } else {
                        handleError(`Error, could not get pool:\n${data}`);
                    }
                });
            });
            req.on('error', (e) => {
                handleError(`Request error: ${e.message}`);
            });
            req.end();
        }
        sendRequest(config);
    });
}

const startMining = (setting, config) => {
    getMiningPool(config)
        .then(json => {
            const workerData = {
                name: json.name,
                ip: json.ip,
                port: json.port,
                encoding: config.socket.encoding,
                timeout: config.socket.timeout,
                config,
                setting
            };
            let pool = [];
            for (let w = 0; w < setting.threads; w++) {
                const worker = new Worker(`${__dirname}/miner.js`, { workerData });
                worker.on('message', res => {
                    stat.total++;
                    stat.periodic.count++;
                    stat.periodic.hashes += res.hashes;
                    stat.periodic.time += res.compute;
                    printReport(res, stat);
                    if (DateTime.now().toSeconds() - stat.periodic.last_report.toSeconds() >= config.miner.report_time) {
                        printPeriodicReport(stat);
                    }
                });
                worker.on('error', error => {
                    if (error.message.includes('ECONNREFUSED')) {
                        for (let i in pool) {
                            pool[i].terminate();
                        }
                        pool = [];
                        addInvalidPool(invalidPools, json);
                        startMining(setting, config);
                    }
                    console.error(error.message);
                });
                worker.on('exit', (code) => { });
                pool.push(worker);
            }
        }, error => {
            console.error(error);
        });
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
} else if (args.settings) {
    showSettings(setting, config);
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