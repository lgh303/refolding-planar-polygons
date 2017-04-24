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
    data = deepcopy(origin_points)
    var s_energy_status = solver.energy_status(data.s_points),
        t_energy_status = solver.energy_status(data.t_points)
    data["s_energy"] = s_energy_status.energy
    data["t_energy"] = t_energy_status.energy
    client.emit('draw', data)
    status_save = {"s_status": s_energy_status, "t_status": t_energy_status}
    client.on('refold', function(message) {
        // anim_scheduler.schedule(500, data, status_save, solver.dist_gd, client)
        anim_scheduler.schedule(60, deepcopy(data), deepcopy(status_save), solver.energy_gd, client)
    })
})

server.listen(3000, function() {
    console.log('Listening on 3000...')
})
