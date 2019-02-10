import { TypedEventEmitter } from 'eventemitter-ts';
import { CoffeeScaleStateMachine, State } from './coffeeScaleStateMachine';
import { Message, Handler} from './Mqtt';

// export declare type OnStateChangedCallback = (state: State) => void

export interface Events {
    message: Message;
  }

export interface CoffeeScaleConfiguration {
    weightEmpty: number,
    weightEmptyCan: number,
    weightFull: number
}
// Setup Json validation
//////////////////////////////////////////////////////////////////////////////////////////
import * as Ajv from 'ajv'
const ajv = new Ajv();

// load generated typescript type information from json schema
import { ScaleMqttTopic } from './schema/scaleMessageSchema'

const energyMqttTopicSchemaValidator = ajv.compile(
        require('../json_schema/scaleMessageSchema.json')
    );
const coffeeStateSchemaValidator = ajv.compile(
        require('../json_schema/coffeeScaleStateSchema.json')
    );
//////////////////////////////////////////////////////////////////////////////////////////


export class CoffeeScale extends TypedEventEmitter<Events> implements Handler {
    outgoingTopic : string;
    weightEmpty: number;
    weightEmptyCan: number;
    weightFull: number;

    coffeeStateMachine: CoffeeScaleStateMachine;

    lastRawValeu: number;

    constructor(outgoingTopic: string, configuration: CoffeeScaleConfiguration) {
        super();
        this.outgoingTopic = outgoingTopic;
        this.weightEmpty = configuration.weightEmpty;
        this.weightEmptyCan = configuration.weightEmptyCan;
        this.weightFull = configuration.weightFull;

        const threshold = this.weightEmpty + ((this.weightEmptyCan - this.weightEmpty) / 2);

        this.coffeeStateMachine = new CoffeeScaleStateMachine(threshold);
        this.coffeeStateMachine.on('stateChanged', this.onStateChanged.bind(this));
    }

    rawValueToCoffeeLevel(rawValue: number) {
        const weight = rawValue;
        const weightEmpty = this.weightEmptyCan;
        const weightFull = this.weightFull;
        const calculatedValue = (weight - weightEmpty) / (weightFull - weightEmpty) * 100;
        if(calculatedValue > 100)
            return 100;
        if(calculatedValue < 0)
            return 0;
        return Math.round(calculatedValue);
    }

    onMessage(message: any) {
        try { //JSON.parse may throw an SyntaxError exception
            console.log(message.toString());
            const messageObj = JSON.parse(message) as ScaleMqttTopic;
            const valid = energyMqttTopicSchemaValidator(messageObj);

            if (true === valid) {
                this.lastRawValeu = messageObj.rawValue;
                // const result = this.rawValueToCoffeeLevel(messageObj.rawValue);
                try {
                    this.coffeeStateMachine.processWeightChange(messageObj.rawValue);
                } catch {
        
                }

                //this.coffeeStateMachine.processPowerChange(messageObj.Power);
                // console.log("hier Verarbeitung einfuegen! %s" , result)
            } else {
                console.log(ajv.errorsText(energyMqttTopicSchemaValidator.errors));
            }
        } catch(e) {
            console.error(e);
        }
    }

    onStateChanged(state: State) {
        const stateObj = {
            state: state.constructor.name,
            weight : this.rawValueToCoffeeLevel(this.lastRawValeu),
            timestamp: new Date().toISOString()
        }
        console.log(stateObj);
        const valid = coffeeStateSchemaValidator(stateObj);
        if (true === valid) {
            const message = {
                topic: this.outgoingTopic,
                message: JSON.stringify(stateObj)
            };
            this.emit('message', message);
       } else {
            console.log(ajv.errorsText(coffeeStateSchemaValidator.errors));
        }
    }
}