var express = require('express')
var app = express()
var server = require('http').Server(app)
var io = require('socket.io')(server)

var fs = require('fs')
var origin_points = {}
fs.readFile("./data/hook.json", 'utf8', function(err, data) {
    if (err) {
        return console.log(err)
    }
    origin_points = JSON.parse(data)
})
var deepcopy = require('deepcopy')

var anim_scheduler = require('./anim_scheduler')
var solver = require('./refolding_solver')

app.use(express.static(__dirname + '/public'))

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html')
})

io.on('connection', function(client) {
    console.log('user on connection')
    points = deepcopy(origin_points)
    io.emit('draw', points)
    client.on('refold', function(data) {
        anim_scheduler.schedule(100, points, solver.metric_gd, io)
    })
})

server.listen(3000, function() {
    console.log('Listening on 3000...')
})
