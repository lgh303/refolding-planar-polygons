var express = require('express')
var app = express()
var server = require('http').Server(app)
var io = require('socket.io')(server)
var fs = require('fs')
var deepcopy = require('deepcopy')

var solver = require('./solver')

app.use(express.static(__dirname + '/public'))

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html')
})

var data = null
var status_save = null
var results = null
fs.readFile("./data/hook.json", "utf8", function(err, json_data) {
    if (err) {
        throw err
    }
    data = JSON.parse(json_data)
    var s_energy_status = solver.energy_status(data.s_points),
        t_energy_status = solver.energy_status(data.t_points)
    data["s_energy"] = s_energy_status.energy
    data["t_energy"] = t_energy_status.energy
    status_save = {"s_status": s_energy_status, "t_status": t_energy_status}
    
    fs.readFile("./data/hook_results.json", "utf8", function(err, json_data) {
        if (err) {
            throw err
        }
        results = JSON.parse(json_data)

        listening()
    })
})

function listening() {
    io.on('connection', function(client) {
        console.log('user on connection')
        client.emit('results', results)
        client.on('refresh', function(message) {
            // re-calculate result data
            var new_results = solver.energy_gd(data, status_save)
            client.emit('results', new_results)
        })
    })
    server.listen(3000, function() {
        console.log('Listening on 3000...')
    })
}
