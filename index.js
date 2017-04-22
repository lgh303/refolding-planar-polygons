var express = require('express')
var app = express()
var server = require('http').Server(app)
var io = require('socket.io')(server)

var fs = require('fs')
var points = {}
fs.readFile("./data/hook.json", 'utf8', function(err, data) {
    if (err) {
        return console.log(err)
    }
    points = JSON.parse(data)
})

app.use(express.static(__dirname + '/public'))

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html')
})

io.on('connection', function(client) {
    console.log('user on connection')
    client.on('load', function(data) {
        console.log(data)
        io.emit('draw', points)
    })
    client.on('refold', function(data) {
        console.log(data)
    })
})

server.listen(3000, function() {
    console.log('Listening on 3000!!!')
})
