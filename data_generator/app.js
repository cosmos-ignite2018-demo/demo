var DocumentDBClient = require('documentdb').DocumentClient;
var uuidv1 = require('uuid/v1');
var random = require('random-name');

if (!process.env.HOST) {
    console.log("HOST env var is required");
    return;
}
else if (!process.env.AUTH_KEY) {
    console.log("AUTH_KEY env var is required");
    return;
}
else if (!process.env.DATABASE_ID) {
    console.log("DATABASE_ID env var is required");
    return;
}
else if (!process.env.COLLECTION_ID) {
    console.log("COLLECTION_ID env var is required");
    return;
}
else if (!process.env.REGION) {
    console.log("REGION env var is required");
    return;
}

var host = process.env.HOST;
var authKey = process.env.AUTH_KEY;
var collLink = "dbs/" + process.env.DATABASE_ID + "/colls/" + process.env.COLLECTION_ID;
var region = process.env.REGION;

client = new DocumentDBClient(host, {
    masterKey: authKey
});

function write() {
    var name = random.first() + " " + random.last();
    var id = uuidv1();

    client.createDocument(collLink, { customer_name: name, "location": region, "id": id}, {partitionKey: id}, function (err, document) {
        if (err) {
            console.log(err);

        } else {
            console.log('created ' + document.id + ' in region ' + region);
        }
    });
}

setInterval(write, 10);