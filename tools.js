var fs = require('fs')
var math = require('mathjs')

function equal_arr(arr1, arr2) {
    if (arr1.length != arr2.length) {
        throw "equal_arr: length not equal"
    }
    for (var i = 0; i < arr1.length; ++i) {
        if (arr1[i] != arr2[i]) {
            return false
        }
    }
    return true
}


function unique_arr(arr) {
    var is_unique = new Array(arr.length);
    for (var i = 0; i < arr.length; ++i) {
        is_unique[i] = true;
    }
    var ret = []
    for (var i = 0; i < arr.length; ++i) {
        if (!is_unique[i]) continue
        ret.push(arr[i])
        for (var j = i + 1; j < arr.length; ++j) {
            if (equal_arr(arr[i], arr[j])) {
                is_unique[j] = false
                break
            }
        }
        
    }
    return ret
}

function centered(vec) {
    var mean = [0, 0]
    for (var i = 0; i < vec.length; ++i) {
        mean[i % 2] += vec[i]
    }
    mean[0] = mean[0] / (vec.length * 0.5)
    mean[1] = mean[1] / (vec.length * 0.5)
    var ret = []
    for (var i = 0; i < vec.length; ++i) {
        ret.push(vec[i] - mean[i % 2])
    }
    return ret
}

function scale_json(name, scalex, scaley) {
    fs.readFile("./data/" + name + ".json", "utf8", function(err, json_data) {
        if (err) {
            throw err
        }
        data = JSON.parse(json_data)
        N = data.s_points.length
        for (var i = 0; i < N; ++i) {
            data.s_points[i][0] = data.s_points[i][0] * scalex
            data.s_points[i][1] = data.s_points[i][1] * scaley
            data.t_points[i][0] = data.t_points[i][0] * scalex
            data.t_points[i][1] = data.t_points[i][1] * scaley
        }
        fs.writeFile("./data/" + name + "_large.json", JSON.stringify(data), function(err) {
            if (err) {
                console.log("Error write large file: " + err)
            }
        })
    })
}
                
exports.unique_arr = unique_arr
exports.centered = centered
exports.scale_json = scale_json
