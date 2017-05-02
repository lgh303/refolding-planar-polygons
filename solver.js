var math = require('mathjs')
var sylvester = require('sylvester')
var pcg = require("conjugate-gradient")
var CSRMatrix = require("csr-matrix")

var utils = require('./utils')
var energy_gradient = utils.energy_gradient
var energy_status = utils.energy_status

const base_learning_rate = 0.03
const max_iter = 303
const THRESHOLD = 0.1

function dist_gd(data, status_save) {
    var results = [data]
    for (var i = 1; i < 20; i++) {
        var s_points = data["s_points"],
            t_points = data["t_points"]
        var dist_gradient = math.multiply(2, math.subtract(s_points, t_points))
        s_points = math.subtract(s_points, math.multiply(base_learning_rate, dist_gradient))
        data = {"s_points": s_points, "t_points": t_points}
        results.push(data)
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

function calc_edge_length(points) {
    var P = points
    var N = P.length
    var lengths = []
    for (var i = 0; i < N; i++) {
        var diffX = P[i][0] - P[(i+1)%N][0],
            diffY = P[i][1] - P[(i+1)%N][1]
        lengths.push(diffX * diffX + diffY * diffY)
    }
    return lengths
}

function calc_constrains_omega(config, edge_constrains) {
    var P = config.points
    var N = P.length
    var omegas = []
    for (var i = 0; i < N; i++) {
        var diffX = P[i][0] - P[(i+1)%N][0],
            diffY = P[i][1] - P[(i+1)%N][1]
        omegas.push(diffX * diffX + diffY * diffY - edge_constrains[i])
    }
    return omegas
}

function update_config_with_constrains(config, D, G, edge_constrains) {
    var P = config.points
    var N = P.length
    var k_list = []
    for (var i = 0; i < N; i++) {
        k_list.push([i, (2*i+0) % (2*N), 2 * (P[i][0] - P[(i+1)%N][0])])
        k_list.push([i, (2*i+1) % (2*N), 2 * (P[i][1] - P[(i+1)%N][1])])
        k_list.push([i, (2*i+2) % (2*N), 2 * (P[(i+1)%N][0] - P[i][0])])
        k_list.push([i, (2*i+3) % (2*N), 2 * (P[(i+1)%N][1] - P[i][1])])
    }
    for (var i = 0; i < 2 * N; i++) {
        k_list.push([N, i, G[i]])
    }
    var K = CSRMatrix.fromList(k_list, N + 1, 2 * N).toDense()
    var alpha = 0.2
    var gamma = 0.4
    var f = calc_constrains_omega(config, edge_constrains)
    f.push(gamma / alpha)
    K = $M(K)
    D = $V(D)
    f = $V(f)

    var A = CSRMatrix.fromDense(K.x(K.transpose()).elements)
    var b = K.x(D).add(f.x(alpha)).elements
    var l = $V(pcg(A, b))
    var proj_D = D.subtract(K.transpose().x(l)).elements

    var move_amount = math.reshape(math.multiply(base_learning_rate, proj_D), [N, 2])
    var candidate_points = math.add(config.points, move_amount),
        candidate_status = energy_status(candidate_points)
    if (candidate_status.energy > config.status.energy) {
        var move_amount_energy = math.reshape(math.multiply(base_learning_rate, G), [N, 2])
        config.points = math.subtract(config.points, move_amount_energy)
        console.log("follow G")
    } else {
        config.points = candidate_points
        console.log("follow proj_D")
    }
}

function energy_gd(data, status_save) {
    var edge_constrains = calc_edge_length(data.s_points)
    
    var results = [data]
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
        // update_config_naive(high_config, D, G)
        update_config_with_constrains(high_config, D, G, edge_constrains)
        
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
        results.push(data)
        if (status_save.distance < THRESHOLD) {
            break
        }
    }
    return results
}

exports.dist_gd = dist_gd
exports.energy_gd = energy_gd
