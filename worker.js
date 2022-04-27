const { start } = require('repl');
const { parentPort } = require('worker_threads');
const amqplib = require('amqplib');
const config = require("./config");

let thread_id;

(async () => {
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

    function start() {
        try {
            ch.consume(config.mq, msg => {
                if (msg !== null) {
                    console.log(thread_id, msg.content.toString());
                    ch.ack(msg);
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
