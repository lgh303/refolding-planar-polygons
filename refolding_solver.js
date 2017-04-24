var math = require('mathjs')
var scheduler = require('./anim_scheduler')

const base_learning_rate = 0.03
const bias_gamma = 1
const stepsize = 10000
const decay_rate = 0.5
const max_iter = 150

// var bound_points = [[-5, -5], [-5, 15], [15, 15], [15, -5]]
// var penalty_weight = 0


function dist_gd(data, status_save, queue, interval) {
    var learning_rate = base_learning_rate
    var steps = 0
    for (var i = 1; i < 20; i++) {
        steps ++;
        if (steps % stepsize == 0) {
            learning_rate *= decay_rate
        }
        var s_points = data["s_points"],
            t_points = data["t_points"]
        var dist_gradient = math.multiply(2, math.subtract(s_points, t_points))
        s_points = math.subtract(s_points, math.multiply(learning_rate, dist_gradient))
        data = {"s_points": s_points, "t_points": t_points}
        scheduler.add_job(queue, interval * i, data)
    }
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
        // bound penalty
        // for (var j = 0; j < 4; j++) {
        //     var grad = energy_gradient(bound_points[j], bound_points[(j + 1) % 4], points[i])
        //     grad_i[0] += penalty_weight * grad.gradient[0]
        //     grad_i[1] += penalty_weight * grad.gradient[1]
        //     energy += penalty_weight * grad.energy
        // }
        energy_grad.push(grad_i)
    }
    return {
        "energy": energy,
        "energy_grad": energy_grad,
    }
}

function energy_gd(data, status_save, queue, interval) {
    var learning_rate = base_learning_rate
    var steps = 0
    var N = data.s_points.length
    for (var i = 0; i < max_iter; i++) {
        steps ++;        
        if (steps % stepsize == 0) {
            learning_rate *= decay_rate
        }
        var s_points = data.s_points,
            t_points = data.t_points
        var s_status = status_save.s_status,
            t_status = status_save.t_status

        var high_config = null,
            low_config = null
        console.log("s_energy = " + s_status.energy)
        console.log("t_energy = " + t_status.energy)
        if (s_status.energy > t_status.energy) {
            high_config = {"points": s_points, "status": s_status, "label": 0}
            low_config = {"points": t_points, "status": t_status}
            console.log("choose high config = S config")
        } else {
            high_config = {"points": t_points, "status": t_status, "label": 1}
            low_config = {"points": s_points, "status": s_status}
            console.log("choose high config = T config")
        }
        var D = math.flatten(math.multiply(-2, math.subtract(high_config.points, low_config.points)))
        var h_grad = math.flatten(high_config.status.energy_grad)
        var G = math.divide(h_grad, math.norm(h_grad))
        var proj_D = D
        console.log("dot indicator: " + math.dot(D, G))
        if (math.dot(D, G) > 0) {
            proj_D = math.subtract(D, math.multiply(math.dot(D, G),  G))
            console.log("dot indicator2: " + math.dot(proj_D, G))
        }
        
        var move_amount = math.reshape(math.multiply(learning_rate, proj_D), [N, 2])
        var candidate_points = math.add(high_config.points, move_amount),
            candidate_status = energy_status(candidate_points)
        console.log("candidate.energy = " + candidate_status.energy + " ~ " + high_config.status.energy)
        if (candidate_status.energy > high_config.status.energy) {
            var proj_D_bias = math.subtract(proj_D, math.multiply(G, bias_gamma))
            var move_amount_bias = math.reshape(math.multiply(learning_rate, proj_D_bias), [N, 2])
            var candidate_points_bias = math.add(high_config.points, move_amount_bias),
                candidate_status_bias = energy_status(candidate_points_bias)
            console.log("candidate.bias.energy = " + candidate_status_bias.energy + " ~ " + high_config.status.energy)
            if (candidate_status_bias.energy > high_config.status.energy) {
                var move_amount_energy = math.reshape(math.multiply(learning_rate, h_grad), [N, 2])
                high_config.points = math.subtract(high_config.points, move_amount_energy)
                console.log("   follow G")
            } else {
                high_config.points = candidate_points_bias
                console.log("   follow proj_D_bias")
            }
        } else {
            high_config.points = candidate_points
            console.log("   follow proj_D")
        }

        if (high_config.label === 0) {
            s_points = high_config.points
        } else {
            t_points = high_config.points
        }

        s_status = energy_status(s_points)
        t_status = energy_status(t_points)
        status_save = {"s_status": s_status, "t_status": t_status}

        data = {
            "s_points": s_points, "t_points": t_points,
            "s_energy": s_status.energy,
            "t_energy": t_status.energy,
        }
        scheduler.add_job(queue, interval * i, data)
    }
}

exports.dist_gd = dist_gd
exports.energy_status = energy_status
exports.energy_gd = energy_gd
