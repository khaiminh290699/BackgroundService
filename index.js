const { RabbitMQ } = require("./src/ultilities")
const { LamChaMe } = require("./src/pages");
const { createPost, syncForums, getCommunity,timerPosting } = require("./src/cosumers");

const rabbitmq = new RabbitMQ();

rabbitmq.consume({ queue: "create_post" }, createPost)

rabbitmq.consume({ queue: "sync_forums" }, syncForums);

rabbitmq.consume({ queue: "get_community" }, getCommunity)

rabbitmq.consume({ queue: "timer_posting" }, timerPosting)