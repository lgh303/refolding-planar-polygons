var solver = require('./solver')

var fs = require('fs')

var save_results = function(data) {
    var s_energy_status = solver.energy_status(data.s_points),
        t_energy_status = solver.energy_status(data.t_points)
    data["s_energy"] = s_energy_status.energy
    data["t_energy"] = t_energy_status.energy
    var status_save = {"s_status": s_energy_status, "t_status": t_energy_status}

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

