const { EventEmitter } = require('events');

const ENTITY_TYPES = {
    BUTTON: 'button',
    SWITCH: 'switch',
    CLIAMTE: 'climate',
    COVER: 'cover',
    LIGHT: 'light',
    MEDIA_PLAYER: 'media_player',
    SENSOR: 'sensor'
};

const BASIC_ENTITY_EVENTS = {
    ALL: '*'
};

const BASIC_ENTITY_ATTR_EVENTS = {
    STATE: 'state',
    MULTI_CHANGE: 'multi_change',
    NAME_CHANGE: 'name_change',
    ALT_NAME_CHANGE: 'alt_name_change',
    AREA_CHANGE: 'area_change'
}

const BASIC_ENTITY_STATES = {
    UNAVAILABLE: 'UNAVAILABLE',
    UNKNOWN: 'UNKNOWN'
};

class Entity extends EventEmitter {
    constructor(type, config = {}) {
        super();

        if (!config.id) throw 'Entity ID Required';
        if (typeof type !== 'string' || !ENTITY_TYPES.includes(type)) throw 'Valid Type Required';


        this._entity_states = Object.values(BASIC_ENTITY_STATES).push(...this._getSubEntityStates());
        this._entity_events = this._getSubEntityEvents();
        this._entity_attr_events = Object.values(BASIC_ENTITY_ATTR_EVENTS).push(...this._getSubEntityAttrEvents());
        this._features = this._getSubEntityFeatures();

        this._id = config.id;
        this._type = type;
        this._deviceClass = config.deviceClass || null;
        this._name = config.name;
        this._deviceId = config.deviceId || null;
        this._area = config.area || null;
        this._state = config.state ? (this._entity_states.includes(config.state) ? config.state : BASIC_ENTITY_STATES.UNKNOWN) : BASIC_ENTITY_STATES.UNKNOWN;
        this._altNames = config.altNames || null;
    }

    get ID() { return this._id; }
    get Type() { return this._type; }
    get DeviceClass() { return this._deviceClass; }
    get DeviceID() { return this._deviceId; }

    get Name() { return this._name; }
    set Name(name) {
        this._name = name;
        this._sendEvent(BASIC_ENTITY_ATTR_EVENTS.NAME_CHANGE, this.Name);
    }

    get AltNames() { return this._altNames; }
    set AltName(altNames) {
        if (typeof altNames === 'object') {
            this._altNames = altNames;
            this._sendEvent(BASIC_ENTITY_ATTR_EVENTS.ALT_NAME_CHANGE, this.AltNames);
        } else {
            throw 'AltNames must be an object with a lang:name format';
        }
    }

    get Area() { return this._area; }
    set Area(area) {
        this._area = area;
        this._sendEvent(BASIC_ENTITY_ATTR_EVENTS.AREA_CHANGE, this.Area);
    }


    get EntityStates() { return this._entity_states; }
    get EntityAttrEvents() { return this._entity_attr_events; }
    get Features() { return this._features; }


    _sendEvent(eventType, value) {
        this.emit(eventType, value);
        this.emit(BASIC_ENTITY_EVENTS.ALL, { entity: this, type: eventType, value: value });
    }

    _setDeviceId(deviceId) {
        this._deviceId = deviceId;
    }

    _setDeviceClass(deviceClass) {
        this._deviceClass = deviceClass;
    }


    setState(state) {
        if (this._entity_states.includes(state)) {
            this._state = state;
            this._sendEvent(BASIC_ENTITY_ATTR_EVENTS.STATE, this.State);
        } else {
            throw 'Invalid State';
        }
    }


    _getSubEntityStates() {
        return [];
    }

    _getSubEntityEvents() {
        return [];
    }

    _getSubEntityAttrEvents() {
        return [];
    }

    _getSubEntityFeatures() {
        return [];
    }


    format() {
        const names = {};

        if (this.AltNames) {
            Object.assign(names, this.AltNames);
        }

        names[this._lang] = this.Name;

        const entity = {
            entity_id: this.ID,
            entity_type: this.Type,
            device_id: this.DeviceID,
            name: names
        };

        if (this.Features.length > 0) {
            entity['features'] = this.Features;
        }

        if (e.Area) {
            entity['area'] = this.Area;
        }

        if (e.DeviceClass) {
            entity['device_class'] = this.DeviceClass;
        }

        return entity;
    }
}

module.exports = {
    Entity: Entity,
    ENTITY_TYPES: ENTITY_TYPES,
    BASIC_ENTITY_EVENTS: BASIC_ENTITY_ATTR_EVENTS,
    BASIC_ENTITY_STATES: BASIC_ENTITY_STATES
};