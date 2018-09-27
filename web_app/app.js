var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var cors = require('cors');
var metrics = require('./cosmosMetrics');
var tickets = require('./ticketPanic');
var path = require('path');

app.use(express.static(__dirname + '/static'));
app.use(cors());

tickets.init(__dirname + '/kubeconfigs')

var currentState;

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

app.get('/regions', function (req, res) {
    return res.json(metrics.getRegions());
});

app.post('/extremepanic', function (req, res) {
    tickets.extremePanic();
    res.status(200).send();
});

app.post('/panic', function (req, res) {
    tickets.panic();
    res.status(200).send();
});

app.post('/calmdown', function (req, res) {
    tickets.calmDown();
    res.status(200).send();
});

app.get('/latency', function (req, res) {
    metrics.getLatency(response => {
        res.json({ latency: latency });
    });
});

app.get('/', function (req, res) {
    res.sendFile('/index.html', { root: __dirname + '/static' });
});

metrics.init(process.env.HOST, process.env.DATABASE_ID, process.env.COLLECTION_ID, process.env.AUTH_KEY);

io.on('connection', function (socket) {
    console.log("connection established");
});

server.listen(8080);
console.log("Cosmos DB demo server is running");

setInterval(() => {
    metrics.getMetrics((result) => {
        if (result && result.totalCount) {
            currentState = result;
            io.emit('onEventsUpdate', currentState);
        }
    });
}, 2000);