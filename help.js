const config = require('./config'),
    valid_diffs = ['LOW', 'MEDIUM', 'NET', 'EXTREME'],
    arg_opts = [
        {
            name: 'help',
            alias: 'h',
            description: 'Display this help',
            type: Boolean
        }, {
            name: 'version',
            alias: 'v',
            description: 'Show miner version',
            type: Boolean
        }, {
            name: 'user',
            alias: 'u',
            description: 'Wallet username',
            type: String
        }, {
            name: 'threads',
            alias: 't',
            description: 'Threads count. Default CPU count',
            type: Number
        }, {
            name: 'difficulty',
            alias: 'd',
            description: `Mining difficulty. Value may be ${valid_diffs}. Default MEDIUM`,
            type: String
        }, {
            name: 'miner',
            alias: 'm',
            description: 'Miner identifier. Default None',
            type: String
        }, {
            name: 'wallet',
            alias: 'w',
            description: 'Show wallet balance',
            type: Boolean
        }, {
            name: 'settings',
            alias: 's',
            description: 'Show miner settings',
            type: Boolean
        }],
    sections = [{
        header: `${config.miner.name} v${config.miner.version}`,
        content: 'A Multi-Threaded Node.JS Miner for DuinoCoin'
    }, {
        header: 'Options',
        optionList: arg_opts
    }, {
        header: 'Synopsis',
        content: [
            'Use node:',
            '$ node index.js {bold --help}',
            '$ node index.js {bold -u Username}',
            '$ node index.js ({italic if saved settings exist})',
            'Use npm:',
            '$ npm run mine -- {bold --help}',
            '$ npm run mine -- {bold -u Username} {bold -t 4} {bold -d LOW}',
            '$ npm run mine -- ({italic if saved settings exist})'
        ]
    }];

module.exports = {
    arg_opts, sections, valid_diffs
}