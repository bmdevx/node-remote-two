const { Entity } = require('../entity');

const ENTITY_TYPE = 'switch';

const SWITCH_STATES = {
    ON: 'ON',
    OFF: 'OFF'
};

const SWITCH_FEATURES = {
    ON_OFF: 'on_off',
    TOGGLE: 'toggle'
}

const SWITCH_EVENTS = {
    TURN_ON: 'on',
    TURN_OFF: 'off',
    TOGGLE: 'toggle'
}

class Switch extends StateEntity {
    constructor(config) {
        super(ENTITY_TYPE, config);
    }

    _getSubEntityStates() {
        return Object.values(SWITCH_STATES);
    }

    _getSubEntityEvents() {
        return Object.values(SWITCH_EVENTS);
    }

    _getSubEntityFeatures() {
        return Object.values(SWITCH_FEATURES);
    }

    turnOn() {
        this.setState(SWITCH_STATES.ON);
        this._sendEvent(SWITCH_EVENTS.TURN_ON, this.State);
    }

    turnOff() {
        this.setState(SWITCH_STATES.OFF);
        this._sendEvent(SWITCH_EVENTS.TURN_OFF, this.State);
    }

    toggle() {
        const on = !(this.State === SWITCH_STATES.ON);
        this.setState(on ? SWITCH_STATES.ON : SWITCH_STATES.OFF);
        this._sendEvent(SWITCH_EVENTS.TOGGLE, on);
    }
}

module.exports = {
    Switch: Switch,
    SWITCH_EVENTS: SWITCH_EVENTS,
    SWITCH_FEATURES: SWITCH_FEATURES,
    SWITCH_STATES: SWITCH_STATES
}