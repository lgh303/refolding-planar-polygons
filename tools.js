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

exports.unique_arr = unique_arr
