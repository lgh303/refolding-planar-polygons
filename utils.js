var math = require('mathjs')

function euclid_distance(s_points, t_points) {
    var distance = 0
    for (var i = 0; i < s_points.length; i++) {
        var diffX = s_points[i][0] - t_points[i][0],
            diffY = s_points[i][1] - t_points[i][1]
        distance += diffX * diffX + diffY * diffY
    }
    return distance
}

function energy_gradient(w, v, p) {
    var proj = v
    var vw = math.subtract(w, v),
        vp = math.subtract(p, v)
    var vw_sqr_len = vw[0] * vw[0] + vw[1] * vw[1]
    if (vw_sqr_len >= 0.005) {
        var proj_ratio = math.dot(vw, vp) / vw_sqr_len
        var t = math.max(0, math.min(1, proj_ratio))
        proj = math.add(v, math.multiply(t, vw))
    }
    // dist(p, <w, v>) = norm(p - proj)
    // energy = \frac{1}{dist(p, <w, v>)^2}
    var projp = math.subtract(p, proj)
    var dist = math.norm(projp)
    var gradient = math.multiply(-4 / math.pow(dist, 3), projp)
    return {"energy": 1.0 / (dist * dist), "gradient": gradient}
}

function energy_status(points) {
    var N = points.length
    var energy = 0
    var energy_grad = []
    for (var i = 0; i < N; i++) {
        var grad_i = [0, 0]
        for (var j = 0; j < N; j++) {
            var next_j = (j + 1) % N
            if (j != i && next_j !== i) {
                var grad = energy_gradient(points[j], points[next_j], points[i])
                grad_i[0] += grad.gradient[0]
                grad_i[1] += grad.gradient[1]
                energy += grad.energy
            }
        }
        energy_grad.push(grad_i)
    }
    return {
        "energy": energy,
        "energy_grad": energy_grad,
    }
}

function status(data) {
    var s_points = data.s_points,
        t_points = data.t_points
    return {
        "s_status": energy_status(s_points),
        "t_status": energy_status(t_points),
        "distance": euclid_distance(s_points, t_points),
    }
}

exports.energy_gradient = energy_gradient
exports.energy_status = energy_status
exports.status = status
