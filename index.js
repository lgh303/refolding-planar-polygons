var express = require('express')
var app = express()
var server = require('http').Server(app)
var io = require('socket.io')(server)
var fs = require('fs')
var deepcopy = require('deepcopy')

var solver = require('./solver')
var utils = require('./utils')

app.use(express.static(__dirname + '/public'))

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/draw.html')
})

const dataset = "leaf_plane"

var data = null
var status_save = null
var results = null
fs.readFile("./data/" + dataset + ".json", "utf8", function(err, json_data) {
    if (err) {
        throw err
    }
    data = JSON.parse(json_data)
    status_save = utils.status(data)
    data["s_energy"] = status_save.s_status.energy
    data["t_energy"] = status_save.t_status.energy
    data["distance"] = status_save.distance
    
    fs.readFile("./data/" + dataset + "_results.json", "utf8", function(err, json_data) {
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
        client.on('run', function(client_data) {
            var new_results = solver.energy_gd(client_data, status_save)
            console.log(new_results)
            client.emit('run', new_results[new_results.length - 1])
        })
        // for test
        client.on("refresh", function(message) {
            var new_results = solver.energy_gd(data, status_save)
            client.emit('results', new_results)
        })
            
    })
    server.listen(3000, function() {
        console.log('Listening on 3000...')
    })
}
