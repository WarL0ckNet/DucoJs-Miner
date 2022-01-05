const { workerData, parentPort, threadId } = require('worker_threads'),
    net = require('net'),
    Rusha = require('rusha');

const socket = new net.Socket(),
    hexHash = Rusha.createHash(),
    single_miner_id = Math.round(2812 * Math.random());

socket.setEncoding(workerData.config.socket.encoding);
socket.setTimeout(workerData.config.socket.timeout);
socket.connect(workerData.port, workerData.ip);

const calcRate = (hashes) => {
    hashes = parseFloat(hashes);
    let hashrate = hashes.toFixed(2) + " h/s";
    if (hashes / 1000 > 0.5) hashrate = (hashes / 1000).toFixed(2) + " Kh/s";
    if (hashes / 1000000 > 0.5) hashrate = (hashes / 1000000).toFixed(2) + " Mh/s";
    if (hashes / 1000000000 > 0.5) hashrate = (hashes / 1000000000).toFixed(2) + " Gh/s";
    return hashrate;
}

const findNumber = (prev, toFind, diff) => {
    return new Promise((resolve, reject) => {
        let last = 100 * diff, start_time = new Date();
        for (let i = 0; i <= last; i++) {
            let hash = hexHash.update(prev + i).digest('hex');
            if (hash == toFind) {
                let time_elapsed = (new Date() - start_time) / 1000;
                resolve({
                    value: i,
                    rate: i / time_elapsed,
                    time: `${(time_elapsed).toFixed(1)} s`
                });
                break;
            }
        }
        resolve({
            value: 0,
            rate: 0,
            time: `${((new Date() - start_time) / 1000).toFixed(1)} s`
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
            report.ping = `${new Date() - start} ms `;
            report.result = s[0];
            parentPort.postMessage(report);
            socket.write(`JOB,${setting.user},${setting.difficulty}`);
        } else if (str.split(',').length === 3) {
            let job = str.split(',');
            report.range = job[2];
            findNumber(job[0], job[1], job[2])
                .then((result) => {
                    report.hashrate = calcRate(result.rate);
                    report.compute = result.time;
                    start = new Date();
                    socket.write(`${result.value},${result.rate},${config.miner.name} v${config.miner.version},${setting.miner},,${single_miner_id}`);
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

socket.on('error', (err) => {
    console.error(`#${threadId}: Socket error: ${err}`);
});

socket.on('end', () => {
    console.log(`\n#${threadId}: Connection ended`);
});

parentPort.on('message', () => {
    socket.write(`JOB,${workerData.setting.user},${workerData.setting.difficulty}`);
});
