module.exports = {
    miner: {
        name: 'DucoJs Miner',
        version: '0.1.1',
        settings: `${__dirname}/settings.json`,
        timeout: 15,
        max_attempts: 10,
        report_time: 120
    },
    server: {
        hostname: 'server.duinocoin.com',
        port: 443,
        path: '/getPool'
    },
    socket: {
        encoding: 'utf8',
        timeout: 15
    }
}