import { IClientOptions, Client, connect} from 'mqtt'
// import * as events from 'events'
import * as Collections from 'typescript-collections';

export interface Message{
    topic: string;
    message: string;
}

export interface Handler{
    onMessage(message: any);
}

class Mqtt {

    mqttClient: Client;
    topicDictionary: Collections.Dictionary<string, Handler>;

    constructor() {
        this.topicDictionary = new Collections.Dictionary<string, Handler>();
    }

    registerTopicHandler(incommintTopic: string, handler: Handler) {

        this.topicDictionary.setValue(incommintTopic, handler);
    
        console.log('register incomming topic:', incommintTopic);
    }

    connect(host: string){
        const opts: IClientOptions = {}

        console.log("Connecting to:", host);

        this.mqttClient = connect(host, opts);
        this.mqttClient.on('connect', this.onConnect.bind(this));
        this.mqttClient.on('message', this.onMessage.bind(this));
    }

    onPublishMessage(message: Message) {
        this.mqttClient.publish(message.topic, message.message);
    }

    onConnect() {
        console.log("Connecton established to", this.mqttClient.options['href']);
        // this.mqttClient.subscribe('tele/Kaffeemaschine/ENERGY');
        this.topicDictionary.forEach(function(key:string) {
            this.mqttClient.subscribe(key);
        }.bind(this));
    }

    // private functions

    onMessage(topic: any, message: any): any {
        const messageHandler = this.topicDictionary.getValue(topic as string);
        if(undefined !== messageHandler) {
            messageHandler.onMessage(message);
        } else {
            console.error("no messge handler found for topic %s", topic);
        }
    }

    end() {
        this.mqttClient.end();
    }
}

export default Mqtt;