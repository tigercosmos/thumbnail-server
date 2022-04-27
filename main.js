const express = require('express')
const { Worker, parentPort } = require('worker_threads');
const amqplib = require('amqplib');
const { v4: uuid } = require('uuid');

const config = require("./config");

const app = express()

const { createClient } = require('redis');

async function init_workers(thread_num, params) {

    return new Promise((resolve, reject) => {
        function handleWorker(thread_id) {
            return new Promise((resolve, reject) => {
                // create worker, do stuff
                const worker = new Worker("./worker.js");

                params["thread_id"] = thread_id;
                worker.postMessage(params);

                worker.on("message", function (e) {
                    resolve(worker);
                });

                worker.on("error", function (err) {
                    reject(err)
                });

            })
        }

        var workers = [];

        for (var i = 0; i < thread_num; i++) {
            workers.push(handleWorker(i))
        }

        Promise.all(workers)
            .then(res => {
                console.log("all workers started")
                resolve(res);
            })
            // handle error
            .catch(err => {
                reject(err)
            });
    });
}

(async () => {
    const redis_cli = createClient(
        { url: 'redis://redis:6379' });
    redis_cli.on('error', (err) => console.log('Redis Client Error', err));
    await redis_cli.connect();

    const mq_conn = await amqplib.connect('amqp://rabbit:5672');

    const workers = await init_workers(1, {
        cmd: "start"
    });

    var ch = await mq_conn.createChannel();

    await ch.assertQueue(config.mq);

    app.get('/', (req, res) => {
        res.send('Hello World!')
    })

    app.get('/api', async (req, res) => {
        const id = uuid();

        console.log("[GET] task id:", id)
        await redis_cli.set(id, {
            status: "in_process",
            image: null
        });

        ch.sendToQueue(config.mq, Buffer.from(id));

        res.status(202).send({ status: "in_process", url: `/check/${id}` });
    })

    app.listen(config.port, () => {
        console.log(`Example app listening on port ${config.port}`)
    })
})();

async function wait(t) {
    await new Promise(resolve => setTimeout(resolve, t));
    return;
}