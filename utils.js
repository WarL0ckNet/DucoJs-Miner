const colors = require('colors'),
    { DateTime } = require('luxon');

const calcDiff = (diff) => {
    if (diff < 1000) {
        return '< 1k';
    } else if (diff < 1000000) {
        return `${Math.round(diff / 1000)}K`;
    } else if (diff < 1000000000) {
        return `${Math.round(diff / 1000000)}M`;
    } else if (diff < 1000000000000) {
        return `${Math.round(diff / 1000000000)}G`;
    } else if (diff < 1000000000000000) {
        return `${Math.round(diff / 1000000000000)}T`;
    }
    return diff;
}

const calcRate = (hashes) => {
    hashes = parseFloat(hashes);
    let hashrate = hashes.toFixed(2) + " h/s";
    if (hashes / 1000 > 0.5) hashrate = (hashes / 1000).toFixed(2) + " Kh/s";
    if (hashes / 1000000 > 0.5) hashrate = (hashes / 1000000).toFixed(2) + " Mh/s";
    if (hashes / 1000000000 > 0.5) hashrate = (hashes / 1000000000).toFixed(2) + " Gh/s";
    return hashrate;
}

const printReport = (res, stat) => {
    let report = `${DateTime.now().toFormat('TT')} ${colors.bgYellow.black.bold(` #${res.thread} `)}`;
    if (res.result === 'GOOD') {
        stat.accepted++;
        report += ` ${colors.brightGreen.bold(res.result)}`;
    } else if (res.result === 'BAD') {
        stat.rejected++;
        report += ` ${colors.brightRed.bold(res.result)}`;
    } else if (res.result === 'BLOCK') {
        stat.blocked++;
        report += ` ${colors.brightYellow.bold(res.result)}`;
    }
    report += ` ${colors.gray.bold(`${stat.accepted}/${stat.total}`)}`;
    report += ` ${colors.magenta.bold(`(${Math.round(100 * stat.accepted / stat.total)}%)`)}`;
    report += ` - ${colors.brightWhite.bold((`${res.compute.toFixed(1)} s`).padStart(8))} -`
    report += ` ${colors.blue.bold(calcRate(res.hashes / res.compute).padStart(12))}`;
    report += ` ${colors.brightWhite.bold(`diff ${calcDiff(res.range).padStart(4)} -`)}`;
    report += ` ${colors.cyan(`ping ${res.ping} ms`)}`;
    console.log(report);
}

const printPeriodicReport = (start_time, stat) => {
    let report = `${DateTime.now().toFormat('TT')} ${colors.bgGreen.black.bold(' () ')} Periodic report:\n`,
        time = Math.round(DateTime.now().toSeconds() - stat.periodic.last_report.toSeconds()), uptime_str = '',
        uptime = DateTime.now().diff(start_time, ['weeks', 'days', 'hours', 'minutes', 'seconds']);
    if (uptime.weeks > 0) uptime_str += `${uptime.weeks} weeks `;
    if (uptime.days > 0) uptime_str += `${uptime.days} days `;
    if (uptime.hours > 0) uptime_str += `${uptime.hours} hours `;
    if (uptime.minutes > 0) uptime_str += `${uptime.minutes} minutes `;
    if (uptime.seconds > 0) uptime_str += `${Math.round(uptime.seconds)} seconds `;
    report += colors.white(`\t > During the last ${time} seconds\n`);
    report += colors.white(`\t > You've mined ${stat.periodic.count} shares (${(stat.periodic.count / time).toFixed(1)} shares/s)\n`);
    report += colors.white(`\t > With the hashrate of ${calcRate(stat.periodic.hashes / stat.periodic.time)}\n`);
    report += colors.white(`\t > In this time period, you've solved ${stat.periodic.hashes} hashes\n`);
    report += colors.white(`\t > Total miner uptime: ${uptime_str}`);
    console.log(report);
    stat.periodic.last_report = DateTime.now();
    stat.periodic.time = 0;
    stat.periodic.hashes = 0;
    stat.periodic.count = 0;
}

const showSettings = (setting, config) => {
    let report = `${colors.white.underline('Miner settings:')}\n`;
    report += `\tTimeout for reconnect to server, s: ${colors.yellow(config.miner.timeout)}\n`;
    report += `\tAttempts for reconnect to server: ${colors.yellow(config.miner.max_attempts)}\n`;
    report += `\tTime for periodic report, s: ${colors.yellow(config.miner.report_time)}\n`;
    report += `\t${colors.cyan('for change this settings edit config.js file (section miner)')}\n\n`;
    report += `${colors.white.underline('User settings:')}\n`;
    report += `\tUsername: ${colors.yellow(setting.user)}\n`;
    report += `\tThreads: ${colors.yellow(setting.threads)}\n`;
    report += `\tDifficulty: ${colors.yellow(setting.difficulty)}\n`;
    report += `\tMiner identifier: ${colors.yellow(setting.miner)}`;
    console.log(report);
}

const isValidMiningPool = (arr, json) => {
    if (arr[json.name]) {
        for (let i in arr[json.name]) {
            const pool = arr[json.name][i];
            if (pool.ip === json.ip && pool.port === json.port) {
                return false;
            }
        }
    }
    return true;
}

const addInvalidPool = (arr, json) => {
    if (isValidMiningPool(arr, json)) {
        if (!arr[json.name]) {
            arr[json.name] = [{
                ip: json.ip,
                port: json.port
            }];
        } else {
            arr[json.name].push({
                ip: json.ip,
                port: json.port
            });
        }
    }
}

module.exports = {
    printReport, printPeriodicReport, showSettings, isValidMiningPool, addInvalidPool
}