var express = require('express')
var app = express()
var server = require('http').Server(app)
var io = require('socket.io')(server)
var fs = require('fs')
var deepcopy = require('deepcopy')
var mkdirp = require('mkdirp');

var solver = require('./solver')
var utils = require('./utils')

app.use(express.static(__dirname + '/public'))

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/draw.html')
})

const dataset = "hook"

var data = null
var status_save = null
var results = null

mkdirp("./upload/", function(err) {
    if (err) {
        console.log("Error making dir: " + err)
    }
})
// fs.readFile("./data/" + dataset + ".json", "utf8", function(err, json_data) {
//     if (err) {
//         throw err
//     }
//     data = JSON.parse(json_data)
//     status_save = utils.status(data)
//     data["s_energy"] = status_save.s_status.energy
//     data["t_energy"] = status_save.t_status.energy
//     data["distance"] = status_save.distance
    
//     fs.readFile("./data/" + dataset + "_results.json", "utf8", function(err, json_data) {
//         if (err) {
//             throw err
//         }
//         results = JSON.parse(json_data)

//         listening()
//     })
// })

function listening() {
    io.on('connection', function(client) {
        console.log('user on connection')
        client.on('run', function(client_data) {
            var new_results = solver.energy_gd(client_data, function(frame) {
                client.emit('run', frame)
            })
        })
        // for test
        // client.emit('results', results)
        // client.on('refresh', function(message) {
        //     var new_results = solver.energy_gd(data, status_save, null)
        //     client.emit('results', new_results)
        // })
        
        client.on('save', function(data){
            var filename = data["filename"]
            var json = data["json"]
            var filepath = '/upload/' + filename + '.json'
            /*var date = new Date();
              var t = date.getTime();*/
            fs.writeFile('.' + filepath, JSON.stringify(json), function(err){
                if (err) {
                    console.log('Error writing file: ' + err)
                } else {
                    client.emit('save', {"filepath": filepath, "filename": filename})
                }
            })
        })

        client.on("get_filenames", function(data){
            fs.readdir("./data/", function(err, filenames) {
                if (err) {
                    console.log("Error reading folder[data]: " + err)
                    return;
                }
                for (var i = 0; i < filenames.length; ++i) {
                    filenames[i] = "./data/" + filenames[i]
                }
                fs.readdir("./upload/", function(err, upload_filenames) {
                    if (err) {
                        console.log("Error reading folder[upload]: " + err)
                        return;
                    }
                    for (var i = 0; i < upload_filenames.length; ++i) {
                        filenames.push("./upload/" + upload_filenames[i])
                    }
                    client.emit('get_filenames', filenames)
                })
            })
        })

        client.on("load", function(filepath){
            fs.readFile(filepath, "utf8", function(err, data) {
                if (err) {
                    console.log("Error: " + err)
                    return;
                }
                json = JSON.parse(data)
                client.emit("load", json)
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

listening()
