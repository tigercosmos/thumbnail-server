const { start } = require('repl');
const { parentPort } = require('worker_threads');
const amqplib = require('amqplib');
const config = require("./config");
const { createClient } = require('redis');

let thread_id;

(async () => {
    const redis_cli = createClient(
        { url: 'redis://redis:6379' });
    redis_cli.on('error', (err) => console.log('Redis Client Error', err));
    await redis_cli.connect();

    const mq_conn = await amqplib.connect('amqp://rabbit:5672');

    var ch = await mq_conn.createChannel();

    await ch.assertQueue(config.mq);

    parentPort.once('message', (message) => {

        if (message.cmd == "start") {
            thread_id = message.thread_id;
            console.log(`worker id ${thread_id} starts.`);
            start();
            parentPort.postMessage("done");
        } else if (message.cmd == "stop") {
            stop();
            parentPort.postMessage("done");
        }
    });

    async function do_task(task_id) {
        const content = await redis_cli.json.get(task_id, {
            path: '.'
        });

        content.status = "done";
        content.new_image = "new_image";

        await redis_cli.json.set(task_id, ".", content);
    }

    function start() {
        try {
            ch.consume(config.mq, async msg => {
                if (msg !== null) {
                    const id = msg.content.toString();
                    console.log(`worker ${thread_id} processes the task ${id}`);

                    await do_task(id);
                    ch.ack(msg);
                    console.log(`worker ${thread_id} finished the task ${id}`);
                }
            });
        } catch (e) {
            console.error(e)
        }
    }

    function stop() {
        mq_conn.close();
    }
})();
