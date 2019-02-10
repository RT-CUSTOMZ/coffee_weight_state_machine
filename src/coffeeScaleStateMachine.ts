import { TypedEventEmitter } from 'eventemitter-ts';

export declare type OnStateChangedCallback = (state: State) => void

export interface State{
    coffeeStateMachine : CoffeeScaleStateMachine;
    weight(value : number);
}

export interface Events {
    stateChanged: State;
  }

const debounceMaxValue = 2;

export class CoffeeScaleStateMachine  extends TypedEventEmitter<Events>  {
    state : State;

    initState : InitState;
    coffeePodPlaced : CoffeePodPlaced;
    coffeePodLifted : CoffeePodLifted;

    threshold: number;

    constructor(threshold: number){
        super();
        this.initState = new InitState(this);
        this.coffeePodPlaced = new CoffeePodPlaced(this);
        this.coffeePodLifted = new CoffeePodLifted(this);
        this.threshold = threshold;
        this.setState(this.initState);
    }

    setState(state: State) {
        this.state = state;
        this.emit('stateChanged', state);
    }

    processWeightChange(value: number) {
        this.state.weight(value);
    }

    getThreshold() : number {
        return this.threshold;
    }
}

export default CoffeeScaleStateMachine;

class InitState implements State {
    coffeeStateMachine: CoffeeScaleStateMachine;

    constructor(coffeeStateMachine: CoffeeScaleStateMachine) {
        this.coffeeStateMachine = coffeeStateMachine;
    }

    weight(value: number) {
        if(this.coffeeStateMachine.getThreshold() < value)
            this.coffeeStateMachine.setState(this.coffeeStateMachine.coffeePodPlaced);
        else
            this.coffeeStateMachine.setState(this.coffeeStateMachine.coffeePodLifted);
        
    }
}

class CoffeePodPlaced implements State {
    coffeeStateMachine: CoffeeScaleStateMachine;
    debounceCounter: number;

    constructor(coffeeStateMachine: CoffeeScaleStateMachine) {
        this.debounceCounter = 0;
        this.coffeeStateMachine = coffeeStateMachine;
    }

    weight(value: number) {
        if( this.coffeeStateMachine.getThreshold() >= value) {
            this.debounceCounter++;
            if(this.debounceCounter >= debounceMaxValue)
                this.coffeeStateMachine.setState(this.coffeeStateMachine.coffeePodLifted);
        } else {
            this.debounceCounter = 0;
        }
    }
}

class CoffeePodLifted implements State {
    coffeeStateMachine: CoffeeScaleStateMachine;
    debounceCounter: number;

    constructor(coffeeStateMachine: CoffeeScaleStateMachine) {
        this.debounceCounter = 0;
        this.coffeeStateMachine = coffeeStateMachine;
    }
    weight(value: number) {
        if(this.coffeeStateMachine.getThreshold() < value) {
            this.debounceCounter++;
            if(this.debounceCounter >= debounceMaxValue)
                this.coffeeStateMachine.setState(this.coffeeStateMachine.coffeePodPlaced);
        } else {
            this.debounceCounter = 0;
        }
    }
}