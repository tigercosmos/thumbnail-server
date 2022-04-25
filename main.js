const express = require('express')
const { Worker, parentPort } = require('worker_threads');
const amqplib = require('amqplib');

const config = require("./config");

const app = express()

const { createClient } = require('redis');

(async () => {
    const redis_cli = createClient(
        { url: 'redis://redis:6379' });
    redis_cli.on('error', (err) => console.log('Redis Client Error', err));
    await redis_cli.connect();

    const mq_conn = await amqplib.connect('amqp://rabbit:5672');


    var ch = await mq_conn.createChannel();

    await ch.assertQueue(config.mq);

    ch.sendToQueue(config.mq, Buffer.from('something to do'));
    ch.sendToQueue(config.mq, Buffer.from('something to do'));
    ch.sendToQueue(config.mq, Buffer.from('something to do'));
    ch.sendToQueue(config.mq, Buffer.from('something to do'));



    app.get('/', (req, res) => {
        res.send('Hello World!')
    })

    app.get('/api', async (req, res) => {
        console.log("DDD")
        await redis_cli.set('key', 'value');
        const value = await redis_cli.get('key');
        console.log("XX", value)

        var onmsg = function (msg) {
            if (msg !== null) {
                console.log(msg.content.toString());
                ch.ack(msg);
            }
        }

        try {
            ch.consume(config.mq, onmsg);
        } catch (e) {
            console.error(e)
        }

        res.send('Hello World!!!!!')

    })

    app.listen(config.port, () => {
        console.log(`Example app listening on port ${config.port}`)
    })
})();

async function wait(t) {
    await new Promise(resolve => setTimeout(resolve, t));
    return;
}