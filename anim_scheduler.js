var Queue = require('bee-queue')

function schedule(interval, points, points_generate, io) {
    var frameQueue = new Queue('post_frame')
    frameQueue.process(function(job, done) {
        console.log("process job " + job.id)
        io.emit('draw', job.data)
        return done()
    })
    points_generate(points, frameQueue, interval)
}

function add_job(queue, delay_time, data) {
    var job = queue.createJob(data)
    setTimeout(function() {
        console.log("add_job, time=" + delay_time)
        job.timeout(10000).retries(0).save(function(err, job) {
            if (err) {
                console.log(err)
            }
        })
    }, delay_time)
 
}

exports.schedule = schedule
exports.add_job = add_job
