import Mqtt from "./Mqtt";
import { CoffeeScale} from './coffeeScale'


const mqttHost = process.env.MQTT_HOST || 'ws://mqtt.42volt.de:9001/'

const coffeeScaleConfigurations = [
  {
    incomming: 'coffee_scale/ESP-99:2e:a5/value',
    outgoing: 'coffee/0/weight',
    config: {
      weightEmpty: 7438509,
      weightEmptyCan: 7713400,
      weightFull:  8218439
    }
  },
];

console.log("Coffee scale state machine is starting");

const mqtt = new Mqtt();
for ( const entry of coffeeScaleConfigurations) {
  const coffeeMachine = new CoffeeScale(entry.outgoing, entry.config);
  mqtt.registerTopicHandler(entry.incomming, coffeeMachine);
  coffeeMachine.on("message", mqtt.onPublishMessage.bind(mqtt));
}
mqtt.connect(mqttHost);


process.on('SIGTERM', function () {
  console.log("Coffee scale state machine is shuting down")
  mqtt.end();

  // shutdown anyway after some time
  setTimeout(function(){
      process.exit(0);
  }, 8000);
});
