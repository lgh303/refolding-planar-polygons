var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');

app.listen(8000);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

io.on('connection', function (socket) {
  
  socket.on('run', function (data) {
    console.log(data);
    // for(var i=0; i<data['s_points'].length; i++) {
    //   data['s_points'][i][0] += 100;
    // }
    
    socket.emit('run', data);
  });
});