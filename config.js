module.exports = {
    miner: {
        name: 'DucoJs Miner',
        version: '0.1.0',
        settings: `${__dirname}/settings.json`
    },
    server: {
        hostname: 'server.duinocoin.com',
        port: 443,
        path: '/getPool'
    },
    socket: {
        encoding: 'utf8',
        timeout: 15000
    }
}