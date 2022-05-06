const { Entity } = require('../entity');

const ENTITY_TYPE = 'sensor';

const SENSOR_STATES = {
    ON: 'ON'
};

const SENSOR_EVENTS = {
    VALUE: 'value',
    UNIT: 'unit'
}

const SENSOR_DEVICE_CLASSES = {
    CUSTOM: 'custom',
    BATTERY: 'battery',
    CURRENT: 'current',
    ENERGY: 'energy',
    HUMIDITY: 'humidity',
    POWER: 'power',
    TEMP: 'temperature',
    VOLTAGE: 'voltage'
}

const DEFAULT_UNITS = {
    CUSTOM: '',
    BATTERY: '%',
    CURRENT: 'A',
    ENERGY: 'kWh',
    HUMIDITY: '%',
    POWER: 'W',
    TEMP: '°C',
    VOLTAGE: 'V'
}

class Sensor extends Entity {
    constructor(config) {
        super(ENTITY_TYPE, config);

        this._setDeviceClass(config.deviceClass ? (SENSOR_DEVICE_CLASSES.includes(config.deviceClass) ? config.deviceClass : SENSOR_DEVICE_CLASSES.CUSTOM) : SENSOR_DEVICE_CLASSES.CUSTOM);

        if (config.unit == null && this.DeviceClass !== SENSOR_DEVICE_CLASSES.CUSTOM) {
            this._unit = DEFAULT_UNITS[this.DeviceClass];
        } else {
            this._unit = config.unit;
        }

        if (config.value && (typeof config.value === 'number' || typeof config.value === 'string')) {
            this._value = config.value;
        } else {
            this._value = '';
        }
    }

    get Value() { return this._value; }


    _getSubEntityStates() {
        return Object.values(SENSOR_STATES);
    }

    _getSubEntityEvents() {
        return Object.values(SENSOR_EVENTS);
    }


    setValue(value, unit = null) {
        this._value = value;

        if (unit !== null) {
            this._unit = unit;
        }

        this._sendEvent(SENSOR_EVENTS.VALUE, this.Value);
    }
}

module.exports = {
    Sensor: Sensor,
    SENSOR_EVENTS: SENSOR_EVENTS,
    SENSOR_STATES: SENSOR_STATES
}