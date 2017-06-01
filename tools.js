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

exports.unique_arr = unique_arr
exports.centered = centered
