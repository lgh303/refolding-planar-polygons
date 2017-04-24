var Queue = require('bee-queue')

function schedule(interval, points, status_save, points_generate, client) {
    var frameQueue = new Queue('post_frame')
    frameQueue.process(function(job, done) {
        client.emit('draw', job.data)
        return done()
    })
    points_generate(points, status_save, frameQueue, interval)
}

function add_job(queue, delay_time, data) {
    var job = queue.createJob(data)
    setTimeout(function() {
        job.timeout(10000).retries(0).save(function(err, job) {
            if (err) {
                console.log(err)
            }
        })
    }, delay_time)
 
}

exports.schedule = schedule
exports.add_job = add_job
