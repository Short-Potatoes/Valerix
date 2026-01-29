const { Kafka } = require("kafkajs");

const kafka = new Kafka({ brokers: ["kafka:9092"] });
const producer = kafka.producer();

(async () => await producer.connect())();

module.exports = async (topic, message) => {
  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(message) }]
  });
};
