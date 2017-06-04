var math = require('mathjs')
var sylvester = require('sylvester')
var pcg = require("conjugate-gradient")
var CSRMatrix = require("csr-matrix")

var tools = require('./tools')
var utils = require('./utils')
var energy_gradient = utils.energy_gradient
var energy_status = utils.energy_status

const base_learning_rate = 0.04
const max_iter = 400
const THRESHOLD = 0.005
const alpha = 0.15
const gamma = 1.5

function dist_gd(data, status_save, callback_draw) {
    var results = [data]
    for (var i = 1; i < max_iter; i++) {
        var s_points = data["s_points"],
            t_points = data["t_points"]
        var dist_gradient = math.multiply(2, math.subtract(s_points, t_points))
        s_points = math.subtract(s_points, math.multiply(base_learning_rate, dist_gradient))
        data = {"s_points": s_points, "t_points": t_points}
        results.push(data)
        if (callback_draw !== null) {
            callback_draw(data)
        }
    }
    return results
}

function update_config_naive(config, D, G) {
    var N = config.points.length
    var proj_D = D
    if (math.dot(D, G) > 0) {
        proj_D = math.subtract(D, math.multiply(math.dot(D, G),  G))
    }
    var move_amount = math.reshape(math.multiply(base_learning_rate, proj_D), [N, 2])
    var candidate_points = math.add(config.points, move_amount),
        candidate_status = energy_status(candidate_points)
    if (candidate_status.energy > config.status.energy) {
        var proj_D_bias = math.subtract(proj_D, math.multiply(G, 1.0))
        var move_amount_bias = math.reshape(
            math.multiply(base_learning_rate, proj_D_bias), [N, 2])
        var candidate_points_bias = math.add(config.points, move_amount_bias),
            candidate_status_bias = energy_status(candidate_points_bias)
        if (candidate_status_bias.energy > config.status.energy) {
            var move_amount_energy = math.reshape(
                math.multiply(base_learning_rate, G), [N, 2])
            config.points = math.subtract(config.points, move_amount_energy)
            console.log("follow G")
        } else {
            config.points = candidate_points_bias
            console.log("follow proj_D_bias")
        }
    } else {
        config.points = candidate_points
        console.log("follow proj_D")
    }
}

function update_config_with_constrains(conf, l_conf, D, G, constrains_pairs) {
    var P = conf.points
    var N = P.length
    var K_sparse = []
    for (var k = 0; k < constrains_pairs.length; k++) {
        var i = constrains_pairs[k][0], j = constrains_pairs[k][1]
        K_sparse.push([k, (2*i+0) % (2*N), 2 * (P[i][0] - P[j][0])])
        K_sparse.push([k, (2*i+1) % (2*N), 2 * (P[i][1] - P[j][1])])
        K_sparse.push([k, (2*j+0) % (2*N), 2 * (P[j][0] - P[i][0])])
        K_sparse.push([k, (2*j+1) % (2*N), 2 * (P[j][1] - P[i][1])])
    }
    
    for (var i = 0; i < 2 * N; i++) {
        K_sparse.push([constrains_pairs.length, i, G[i]])
    }
    var n_constrains = constrains_pairs.length + 1
    var K = CSRMatrix.fromList(K_sparse, n_constrains, 2 * N).toDense()
    var f = utils.calc_constrains_omega(conf, l_conf, constrains_pairs)
    f.push(gamma)
    K = $M(K)
    D = $V(D)
    f = $V(f)

    var A = CSRMatrix.fromDense(K.x(K.transpose()).elements)
    var b = K.x(D).add(f.x(alpha)).elements
    var l = $V(pcg(A, b))
    var proj_D = D.subtract(K.transpose().x(l)).elements
    //proj_D = tools.centered(proj_D)

    var move_amount = math.reshape(math.multiply(base_learning_rate, proj_D), [N, 2])
    var candidate_points = math.add(conf.points, move_amount),
        candidate_status = energy_status(candidate_points)
    if (candidate_status.energy > conf.status.energy) {
        var move_amount_energy = math.reshape(math.multiply(base_learning_rate, G), [N, 2])
        conf.points = math.subtract(conf.points, move_amount_energy)
        console.log("follow G")
    } else {
        conf.points = candidate_points
        console.log("follow proj_D")
    }
}

function energy_gd(data, callback_draw) {
    var status_save = utils.status(data)
    data["s_energy"] = status_save.s_status.energy
    data["t_energy"] = status_save.t_status.energy
    data["distance"] = status_save.distance
    var results = [data]
    var edge_constrains_pairs = data.edge_constrains
    if (edge_constrains_pairs === undefined) {
        edge_constrains_pairs = []
    }
    var N = data.s_points.length
    // for (var i = 0; i < N; ++i) {
    //     edge_constrains_pairs.push([i, (i + 1) % N])
    // }
    edge_constrains_pairs = tools.unique_arr(edge_constrains_pairs)
    
    for (var i = 0; i < max_iter; i++) {
        console.log("Iteration " + i)
        var s_points = data.s_points, t_points = data.t_points
        var s_status = status_save.s_status, t_status = status_save.t_status

        var high_config = null, low_config = null
        if (s_status.energy > t_status.energy) {
            high_config = {"points": s_points, "status": s_status, "label": 0}
            low_config = {"points": t_points, "status": t_status}
        } else {
            high_config = {"points": t_points, "status": t_status, "label": 1}
            low_config = {"points": s_points, "status": s_status}
        }
        
        var D = math.flatten(math.multiply(-2, math.subtract(high_config.points, low_config.points)))
        var h_grad = math.flatten(high_config.status.energy_grad)
        var G = math.divide(h_grad, math.norm(h_grad))
        if (edge_constrains_pairs.length === 0) {
            update_config_naive(high_config, D, G)    
        } else {
            update_config_with_constrains(high_config, low_config, D, G, edge_constrains_pairs)
        }
        if (high_config.label === 0) {
            s_points = high_config.points
        } else {
            t_points = high_config.points
        }

        status_save = utils.status(data)
        data = {
            "s_points": s_points, "t_points": t_points,
            "s_energy": status_save.s_status.energy,
            "t_energy": status_save.t_status.energy,
            "distance": status_save.distance,
        }
        console.log("s_energy: " + status_save.s_status.energy.toPrecision(4) +
                    "; t_energy: " + status_save.t_status.energy.toPrecision(4) +
                    "; distance: " + status_save.distance.toPrecision(4))
        results.push(data)
        if (callback_draw !== null) {
            callback_draw(data)
        }
        if (status_save.distance < THRESHOLD) {
            break
        }
    }
    return results
}

exports.dist_gd = dist_gd
exports.energy_gd = energy_gd
