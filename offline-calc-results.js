var solver = require('./solver')
var utils = require('./utils')

var fs = require('fs')

var save_results = function(data) {
    var status_save = utils.status(data)
    data["s_energy"] = status_save.s_status.energy
    data["t_energy"] = status_save.t_status.energy
    data["distance"] = status_save.distance

    var results = solver.energy_gd(data, status_save)

    fs.writeFileSync("./data/hook_results.json", JSON.stringify(results),
                     "utf8", function(err) {
        if (err) {
            throw err
        }
    })
}

var points = null
fs.readFile("./data/hook.json", "utf8", function(err, data) {
    if (err) {
        throw err
    }
    points = JSON.parse(data)
    save_results(points)
})
