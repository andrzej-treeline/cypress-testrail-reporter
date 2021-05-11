const fs = require('fs');
const path = require('path');

const arch = process.arch;
    const platform = process.platform;
    const nodeV = /[0-9]+\.[0-9]+/.exec(process.versions.node)[0];
    const nodeVM = /[0-9]+/.exec(process.versions.node)[0];

let modPath = platform + '-' + arch + '-node-' + nodeV;
try {
    fs.statSync(path.join(__dirname, '..', 'deasync', 'bin', modPath, 'deasync.node'));
}
catch (ex) {
    modPath = platform + '-' + arch + '-node-' + nodeVM;
    fs.statSync(path.join(__dirname, '..', 'deasync', 'bin', modPath, 'deasync.node'));
}
const installPath = path.join(__dirname, '..', 'deasync', 'build', 'deasync.node');
const targetPath = path.join(__dirname, '..', 'deasync', 'bin', modPath, 'deasync.node');
console.log(`Checking deasync installation at ${installPath} or copy from ${targetPath}`);
try {
    fs.mkdirSync(path.join(__dirname, '..', 'deasync', 'build'));
}
catch (ex) {}
try {
    fs.mkdirSync(path.join(__dirname, '..', 'deasync', 'build', modPath));
}
catch (ex) {}
try {
    fs.statSync(installPath);
} catch (err) {
    try {
    fs.statSync(targetPath);
    }
    catch (ex) {
    console.error('Build succeeded but target not found');
    process.exit(1);
    }
    fs.renameSync(targetPath, installPath);
    console.log('Installed in `' + installPath + '`');
}

module.exports = require('./dist/cypress-testrail-reporter').CypressTestRailReporter;
