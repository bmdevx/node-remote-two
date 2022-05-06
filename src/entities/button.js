const { Entity } = require('../entity');

const ENTITY_TYPE = 'button';

const BUTTON_STATES = {
    AVAILABLE: 'AVAILABLE'
};

const BUTTON_FEATURES = {
    PRESS: 'press'
}

const BUTTON_EVENTS = {
    PRESSED: 'pressed'
}

class Button extends Entity {
    constructor(config) {
        super(ENTITY_TYPE, config);
    }

    _getSubEntityStates() {
        return Object.values(BUTTON_STATES);
    }

    _getSubEntityEvents() {
        return Object.values(BUTTON_EVENTS);
    }

    _getSubEntityAttrEvents() {
        return [];
    }

    _getSubEntityFeatures() {
        return Object.values(BUTTON_FEATURES);
    }

    press() {
        this._sendEvent(BUTTON_EVENTS.PRESSED, true);
    }
}

module.exports = {
    Button: Button,
    BUTTON_EVENTS: BUTTON_EVENTS,
    BUTTON_FEATURES: BUTTON_FEATURES,
    BUTTON_STATES: BUTTON_STATES
}