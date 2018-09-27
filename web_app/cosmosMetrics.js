var CosmosMetrics = function () {
    var async = require('async');
    var DocumentDBClient = require('documentdb').DocumentClient;
    var Stopwatch = require('timer-stopwatch');
    var client;

    var regions = ["westus", "eastus", "southcentralus", "northcentralus", "centralus", "centralcanada", "northeurope", "eastcanada", "eastjapan", "southbrazil", "centralfrance", "southuk", "westuk", "southeastaustralia"];
    var collLink;

    function getRegions() {
        return regions;
    }

    function init(host, databaseID, collectionID, authKey) {
        client = new DocumentDBClient(host, {
            masterKey: authKey
        });

        collLink = "dbs/" + databaseID + "/colls/" + collectionID
    }

    function getMetrics(callback) {
        var totalCount = 0;
        var regionCount = [];

        var asyncTasks = [];

        regions.forEach(region => {
            asyncTasks.push((asyncCallback) => {
                getEventCountPerRegion(region, (count) => {
                    if (count) {
                        regionCount.push({
                            name: region,
                            count: count
                        })
                    }

                    asyncCallback();
                })
            });
        });

        async.parallel(asyncTasks, function (err, result) {
            if (err) {
                console.log(err);
                callback(null);
            }
            else {
                total = 0;

                regionCount.forEach(region => {
                    total = total + region.count;
                });
                
                callback({
                    totalCount: total,
                    regions: regionCount
                });
            }
        });
    }

    function getEventCountPerRegion(region, callback) {
        var query = 'SELECT VALUE COUNT(1) FROM root e WHERE e.location="' + region + '"'

        var querySpec = {
            query: query
        };

        client.queryDocuments(collLink, querySpec, { enableCrossPartitionQuery: true }).toArray(function (err, results) {
            if (err) {
                console.log(err);
                callback(null);
            }
            else
                callback(results[0])
        });
    }

    function getLatency(callback) {
        var query = 'SELECT TOP 1 * FROM C'

        var querySpec = {
            query: query
        };

        var stopwatch = new Stopwatch();
        stopwatch.start();

        client.queryDocuments(collLink, querySpec, { enableCrossPartitionQuery: true }).toArray(function (err, results) {
            stopwatch.stop();

            if (err) {
                console.log(err);
                callback(null);
            }
            else
                callback(stopwatch.ms + "ms");
        });
    }

    return {
        init: init,
        getMetrics: getMetrics,
        getRegions: getRegions,
        getLatency: getLatency
    }
}();

module.exports = CosmosMetrics;