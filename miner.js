const { workerData, parentPort, threadId } = require('worker_threads'),
    net = require('net'),
    Rusha = require('rusha');

const socket = new net.Socket({
    allowHalfOpen: true
}),
    hexHash = Rusha.createHash(),
    single_miner_id = Math.round(2812 * Math.random());

socket.setEncoding(workerData.config.socket.encoding);
socket.setTimeout(workerData.config.socket.timeout * 1000);
socket.connect(workerData.port, workerData.ip);

const findNumber = (prev, toFind, diff) => {
    return new Promise((resolve, reject) => {
        let last = 100 * diff, start_time = new Date();
        for (let i = 0; i <= last; i++) {
            let hash = hexHash.update(prev + i).digest('hex');
            if (hash == toFind) {
                resolve({
                    value: i,
                    time: (new Date() - start_time) / 1000
                });
                break;
            }
        }
        resolve({
            value: 0,
            time: (new Date() - start_time) / 1000
        });
    });
}

const start = (setting, config) => {
    let start, report = { thread: threadId };
    console.log(`#${threadId}: Start mining...`);
    socket.on('data', (data) => {
        const str = data.toString().trim();
        if (str.includes('GOOD') || str.includes('BAD') || str.includes('BLOCK')) {
            let s = str.split(',');
            report.ping = new Date() - start;
            report.result = s[0];
            parentPort.postMessage(report);
            socket.write(`JOB,${setting.user},${setting.difficulty}`);
        } else if (str.split(',').length === 3) {
            let job = str.split(',');
            report.range = job[2];
            findNumber(job[0], job[1], job[2])
                .then((result) => {
                    report.compute = result.time;
                    report.hashes = result.value;
                    start = new Date();
                    socket.write(`${result.value},${result.value / result.time},${config.miner.name} v${config.miner.version},${setting.miner},,${single_miner_id}`);
                });
        } else {
            socket.write(`JOB,${setting.user},${setting.difficulty}`);
        }
    });
}

socket.once('data', (data) => {
    if (data.toString().includes('2.')) {
        if (threadId === 1) {
            console.log(`Server version: ${data.toString()}`);
        }
        socket.write(`MOTD`);
        start(workerData.setting, workerData.config);
    } else {
        console.error(data.toString());
        socket.end();
    }
});

socket.on('connect', (data) => {
    console.log(`#${threadId} Socket connected`);
});

socket.on('error', (err) => {
    throw new Error(`#${threadId}: Socket error: ${err.message}`);
});

socket.on('end', () => {
    console.log(`#${threadId}: Connection ended`);
    socket.connect(workerData.port, workerData.ip);
    socket.write(`MOTD`);
    start(workerData.setting, workerData.config);
    //throw new Error(`#${threadId}: Connection ended`);
});

parentPort.on('message', () => {
    socket.write(`JOB,${workerData.setting.user},${workerData.setting.difficulty}`);
});
