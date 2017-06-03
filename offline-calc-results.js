var solver = require('./solver')
var utils = require('./utils')

var fs = require('fs')

const dataset = "test"

var save_results = function(data) {
    var results = solver.energy_gd(data, null)

    fs.writeFileSync("./data/" + dataset + "_results.json", JSON.stringify(results), "utf8", function(err) {
        if (err) {
            throw err
        }
    })
}

var points = null
fs.readFile("./data/" + dataset + ".json", "utf8", function(err, data) {
    if (err) {
        throw err
    }
    points = JSON.parse(data)
    save_results(points)
})
