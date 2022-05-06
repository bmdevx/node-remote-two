const { EventEmitter } = require('events');
const express = require('express');
const expressWS = require('express-ws');
const bodyParser = require('body-parser');

const { Device, DEVICE_EVENTS, DEVICE_STATES } = require('./device');
const { Entity, ENTITY_TYPES } = require('./entity');

const ERROR = 'err';

const CATEGORIES = {
    DEVICE: 'DEVICE',
    ENTITY: 'ENTITY'
}

const EVENT_MSG = {
    DEVICE_STATE: 'device_state',
    AUTH_REQUIRED: 'auth_required',
}

const RESPONSE_MSG = {
    AUTHENTICATON: 'authentication',
    DRIVER_VERSION: 'driver_version',
    AVAILABLE_ENTITIES: 'available_entities',
}

const REQUEST_MSG = {
    AUTH: 'auth'
}

const MSG_KINDS = {
    EVENT: 'event',
    RESPONSE: 'resp',
    REQUEST: 'req'
}

const DEFAULT_VERSION = {
    api: '0.5.0',
    driver: '1.0.0'
};

const DEFAULT_PORT = 4000;
const DEFAULT_INTEGRATION_NAME = 'my-integration';
const DEFAULT_LANG = 'en';

class RemoteTwoIntegrationServer extends EventEmitter {

    constructor(config = {}) {
        super();

        this._port = config.port || DEFAULT_PORT;
        this._int_name = config.name || DEFAULT_INTEGRATION_NAME;
        this._version = config.version || DEFAULT_VERSION;
        this._TOKEN = config.apiKey || api.token || config.tokens || null;
        this._requiresAuthentication = this._TOKEN !== null;
        this._lang = this.lang || DEFAULT_LANG;

        this._devices = config.devices || {};

        this._server = expressWS(express());
        this._server.use(bodyParser.json());

        this._clients = {};

        const processMsg = (msg) => {


        };

        const pingClients = () => {
            Object.values(this._clients).forEach(client => {
                if (!client.isAlive) {
                    client.ws.terminate();
                }

                client.isAlive = false;
                client.ws.ping();
            });
        }


        this._server.ws('/intg', (ws, req) => {
            const client = this._createClient(ws, req);

            if (this._clients[client.ip]) {
                client.close(400); //client already exists
            } else {
                this._clients[client.ip] = client;
            }

            ws.on('message', msgRaw => {
                const msg = JSON.parse(msgRaw);

                if (client.authenticated) {
                    processMsg(msg);
                } else {
                    client.authenticated = this._isValidAuthMsg(msg);
                    this._authentication(client, msg.req_id);

                    if (!authenticated) {
                        client.close(401);
                    }
                }
            });

            ws.on('close', () => {
                delete this._clients[client.ip];
            });

            ws.on('pong', () => {
                client.isAlive = true;
            });

            if (client.authenticated) {
                this._authentication(client, null);
            } else {
                this._authRequired(client);
            }
        });


        this.start = () => {
            return new Promise((res, rej) => {
                this._server.listen(this._port, _ => {
                    this._listening = true;

                    if (this._pingInterval) clearInterval(this._pingInterval);
                    this._pingInterval = setInterval(pingClients, 60000);

                    res(true);
                })
                    .catch(e => {
                        this._listening = false;
                        const errMsg = `Failed to start WSS. Error: ${e}`;
                        this.emit(ERROR, errMsg);
                        rej(errMsg);
                    });
            });
        }

        this.stop = () => {
            if (this._listening) {
                if (this._pingInterval) clearInterval(this._pingInterval);
                this._server.close();
                this._listening = false;
            }
        }
    }


    //Msg Types
    _createEvent(msg, msg_data, category = null) {
        const event = {
            kind: MSG_KINDS.EVENT,
            msg: msg,
            ts: new Date().getTime()
        };

        if (msg_data) {
            event.msg_data = msg_data;
        }

        if (category) {
            event.cat = category;
        }

        return msg;
    }

    _createResponse(msg, reqId, msg_data = null, code = 200) {
        const resp = {
            kind: MSG_KINDS.RESPONSE,
            req_id: reqId,
            msg: msg,
            code: code
        };

        if (msg_data) {
            msg.msg_data = msg_data;
        }

        return resp;
    }


    //Create / Auth Clients
    _createClient(ws, req) {
        const apiKey = req.headers['API-KEY'];
        var authenticated = !this._requiresAuthentication;
        if (!authenticated && apiKey) {
            authenticated = this._validateToken(apiKey);
        }

        return {
            ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            ws: ws,
            isAlive: true,
            authenticated: authenticated,
            send: (msg) => {
                try {
                    ws.send(JSON.parse(msg));
                } catch (e) {
                    this.emit(ERROR, e)
                }
            },
            close: (code) => {
                try {
                    ws.close(code);
                } catch (e) {
                    this.emit(ERROR, e)
                }
            }
        }
    }

    _authRequired(client) {
        client.send(this._createEvent(
            EVENT_MSG.AUTH_REQUIRED,
            {
                name: this._int_name,
                version: this._version
            })
        );
    }

    _authentication(client, reqId) {
        client.send(this._createResponse(
            RESPONSE_MSG.AUTHENTICATON,
            reqId ? reqId : 0,
            null,
            client.authenticated ? 200 : 401)
        );
    }

    _validateToken(token) {
        return Array.isArray(this._TOKEN) ? this._TOKEN.includes(token) : token === this._TOKEN;
    }

    _isValidAuthMsg(reqMsg) {
        return !this._requiresAuthentication ||
            (reqMsg.kind === MSG_KINDS.REQUEST, reqMsg.msg === REQUEST_MSG.AUTH,
                reqMsg.msg_data && this._validateToken(reqMsg.msg_data.token));
    }


    //Send Events
    _sendEventToClients(event) {
        const msg = JSON.stringify(event);
        Object.values(this._clients).forEach(client => {
            if (client.isAlive) {
                client.send(msg);
            }
        });
    }

    _sendDeviceState(device) {
        this._sendEventToClients(
            this._createEvent(
                EVENT_MSG.DEVICE_STATE,
                {
                    device_id: device.ID,
                    state: device.State
                },
                CATEGORIES.DEVICE
            ))
    }


    //Server Info
    _getDriverVersion(client, reqMsg) {
        client.send(this._createResponse(
            RESPONSE_MSG.DRIVER_VERSION,
            reqMsg.req_id,
            {
                name: this._int_name,
                version: this._version
            })
        );
    }

    //Devices
    _onDeviceEvent(event) {
        switch (event.type) {
            case DEVICE_EVENTS.STATE_CHANGE: this._sendDeviceState(event.device); break;
        }
    }

    _getDeviceState(client, reqMsg) {
        var deviceId = reqMsg.msg_data.device_id;

        if (!deviceId) {
            deviceId = 0;
        }

        const device = this._devices[deviceId];
        if (device) {
            client.send(
                this._createEvent(
                    EVENT_MSG.DEVICE_STATE,
                    {
                        device_id: device.Id,
                        state: device.State
                    },
                    CATEGORIES.DEVICE)
            );
        } else {
            client.send(this._createResponse(EVENT_MSG.DEVICE_STATE, reqMsg.req_id, null, 400));
        }
    }


    addDevice(device) {
        return new Promise((res, rej) => {
            if (this._devices[device.ID]) {
                rej('Device with this ID already exists');
            } else {
                this._devices[device.ID] = device;
                device.on(DEVICE_EVENTS.ALL, this._onDeviceEvent);


                //subscribe to entity events

                res(true);
            }
        });
    }

    removeDevice(device) {
        return new Promise((res, rej) => {
            if (!this._devices[device.ID]) {
                rej('Device with this ID does not exist');
            } else {
                device.removeListener(DEVICE_EVENTS.ALL, this._onDeviceEvent);
                delete this._devices[device.ID];
                res(true);
            }
        });
    }

    //Entities
    getEntities(filter) {
        if (filter == null) {
            filter = { device_id: null, entity_type: null }
        }

        const entities = [];

        Object.values(this._devices)
            .forEach(device => {
                if (filter.device_id == null || filter.device_id === device.ID) {
                    entities.push(...device.getEntities(filter.entity_type))
                }
            });

        return entities;
    }

    _getAvailableEntities(client, reqMsg) {
        var filter = null;

        if (reqMsg.msg_data && reqMsg.msg_data.filter) {
            filter = reqMsg.msg_data.filter;
        }

        const msg_data = {
            available_entities: this.getEntities(filter).map(e => e.format())
        }

        if (filter) {
            msg_data.filter = filter;
        }

        client.send(this._createResponse(
            RESPONSE_MSG.AVAILABLE_ENTITIES,
            reqMsg.req_id,
            msg_data
        ))
    }

}

module.exports = RemoteTwoIntegrationServer;