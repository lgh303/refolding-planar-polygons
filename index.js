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
            var new_results = solver.energy_gd(client_data, status_save, function(frame) {
                client.emit('run', frame)
            })
        })
        // for test
        client.on('refresh', function(message) {
            var new_results = solver.energy_gd(data, status_save, null)
            client.emit('results', new_results)
        })
        
        client.on('save', function(data){
            var filename = data["filename"]
            var json = data["json"]
            var filepath = '/upload/' + filename + '.json'
            /*var date = new Date();
            var t = date.getTime();*/
            fs.writeFile('.' + filepath, JSON.stringify(json), function(err){
                if (err) {
                    console.log('写文件错误')
                } else {
                    client.emit('save', {"filepath": filepath, "filename": filename})
                }
            })
        })
    })
    server.listen(3000, function() {
        console.log('Listening on 3000...')
    })
}


// 动态文件访问
app.use(express.static(__dirname + '/upload'))
app.get('/upload/:name', function (req, res, next) {
  var options = {
    root: __dirname + '/upload/',
    dotfiles: 'deny',
    headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
    }
  };
  var fileName = req.params.name;
  res.sendFile(fileName, options, function (err) {
    if (err) {
      console.log(err);
      res.status(err.status).end();
    }
    else {
      console.log('Sent:', fileName);
    }
  });
})
