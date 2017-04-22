var math = require('mathjs')
var scheduler = require('./anim_scheduler')

var base_learning_rate = 0.1
var stepsize = 9
var decay_rate = 0.5

function metric_gd(points, queue, interval) {
    var learning_rate = base_learning_rate
    var steps = 0
    for (var i = 1; i < 20; i++) {
        steps ++;        
        if (steps % stepsize == 0) {
            learning_rate *= decay_rate
        }
        var s_points = points["s_points"]
        var t_points = points["t_points"]
        var gradient = math.multiply(2, math.subtract(s_points, t_points))
        s_points = math.subtract(s_points, math.multiply(learning_rate, gradient))
        points = {"s_points": s_points, "t_points": t_points}
        scheduler.add_job(queue, interval * i, points)
    }
}

exports.metric_gd = metric_gd
