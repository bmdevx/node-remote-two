const { EventEmitter } = require('events');
const { Entity } = require('./entity');

const DEVICE_EVENTS = {
    ALL: '*',
    STATE_CHANGE: 'state_change'
}

const DEVICE_STATES = {
    CONNECTED: 'CONNECTED',
    CONNECTING: 'CONNECTING',
    DISCONNECTED: 'DISCONNECTED',
    ERROR: 'ERROR'
};

class Device extends EventEmitter {
    constructor(config = {}) {
        super();

        if (!config.id) throw 'Device ID Required';

        this._id = config.id;
        this._state = config.state || DEVICE_STATES.CONNECTED;
        this._entities = config.entities || {}
    }

    _sendEvent(eventType, value) {
        this.emit(eventType, value);
        this.emit(DEVICE_EVENTS.ALL, { device: this, type: eventType, value: value });
    }

    get ID() { return this._id; }

    get State() { return this._state; }
    set State(state) {
        if (DEVICE_STATES.includes(state)) {
            this._state = state;
            this._sendEvent(DEVICE_EVENTS.STATE_CHANGE, this.State);
        } else {
            throw 'Invalid Device State';
        }
    }

    get Entities() { return this._entities; }

    getEntities(entityType) {
        return this.Entities.filter(e => entityType == null || e.Type === entityType);
    }


    addEntity(entity) {
        entity._setDeviceId(ID);
    }

    removeEntity(entity) {
    }

}


module.exports = {
    Device: Device,
    DEVICE_EVENTS: DEVICE_EVENTS,
    DEVICE_STATES: DEVICE_STATES
};