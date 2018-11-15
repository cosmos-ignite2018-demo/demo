var TicketPanic = function () {
    var fs = require('fs');
    var Client = require('kubernetes-client').Client;
    var baseDir;

    function scaleWriterDeployment(client, replicas) {
        client.apis.apps.v1.ns('default').deploy('cosmos-ignite-writer').patch({
            body: {
                spec: {
                    replicas: replicas
                }
            }
        });
    }

    function init(dirPath) {
        baseDir = dirPath;
    }

    function createKubeClient(filePath) {
        var config = require('kubernetes-client').config;
        var client = new Client({ config: config.loadKubeconfig(filePath), version: '1.9' });
        
        return client;
    }

    async function panic() {
        var panicDir = baseDir + '/panic';

        fs.readdir(panicDir, (err, files) => {
            files.forEach(file => {
                var client = createKubeClient(panicDir + '/' + file);
                scaleWriterDeployment(client, 4)
            });
        })
    }

    async function extremePanic() {
        var extPanicDir = baseDir + '/all';

        fs.readdir(extPanicDir, (err, files) => {
            files.forEach(file => {
                var client = createKubeClient(extPanicDir + '/' + file);
                scaleWriterDeployment(client, 4)
            });
        })
    }

    function calmDown() {
        var extPanicDir = baseDir + '/all';

        fs.readdir(extPanicDir, (err, files) => {
            files.forEach(file => {
                var client = createKubeClient(extPanicDir + '/' + file);
                scaleWriterDeployment(client, 0)
            });
        });
    }

    return {
        scaleWriterDeployment: scaleWriterDeployment,
        panic: panic,
        extremePanic: extremePanic,
        calmDown: calmDown,
        init: init
    }
}();

module.exports = TicketPanic;