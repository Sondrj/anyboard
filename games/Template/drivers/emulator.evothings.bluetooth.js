"use strict";

(function(){
	var emulator = new AnyBoard.Driver({
		name: 'anyboard-bluetooth-emulator-token',
        description: 'Driver based off evothings.ble.peripheral library for Cordova-based apps. ' +
      				  'Discovers, connects to and reads characteristics of bluetooth devices',
        dependencies: 'evothings.ble',
        version: '0.1',
        date: '2017-02-08',
        type: ['bluetooth-emulator'],
        compatibility: [

                characteristic_uuid: 'deaddead-0000-1000-8000-00805f9b34fb',
                service_uuid: '0000dead-0000-1000-8000-00805f9b34fb'
        ]
	});

    emulator._GenericSend = function(name, functionId, hasParams, useCache) {
        var tmpId = functionId;
        var internalSend = function(token, data, win, fail) {
            AnyBoard.Logger.debug("Executing " + name, token);
            if (useCache && token.cache.hasOwnProperty(name)) {
                win && win(token.cache[name]);
                return;
            }
            emulator.send(
                token,
                data,
                function(){
                    token.once(name,
                        function(token, returnData) {
                            if (useCache && returnData !== undefined) {
                                token.cache[name] = returnData;
                            }
                            win && win(returnData);
                        }
                    )
                },
                function(errorCode){ fail && fail(errorCode);}
            )
        };
        if (!hasParams) {
            var newData = new Uint8Array(1);
            newData[0] = tmpId;
            return function(token, win, fail) {
                internalSend(token, newData, win, fail);
            };
        }
        return function(token, data, win, fail) {
            var newData = new Uint8Array(data.length+1);
            newData[0] = tmpId;
            for (var index in data) {
                if (data.hasOwnProperty(index))
                    newData[parseInt(index)+1] = data[index];
            }
            internalSend(token, newData, win, fail);
        }
    };

    emulator._subscribe = function(token, callback, success, fail)
    {
        evothings.ble.writeDescriptor(
            token.device.deviceHandle,
            token.device.descriptors['00002911-0000-1000-8000-00805f9b34fb'].handle,
            new Uint8Array([1,0])
            );

        evothings.ble.enableNotification(
            token.device.deviceHandle,
            token.device.characteristics['00002910-0000-1000-8000-00805f9b34fb'].handle,
            function(data){
                data = new DataView(data);
                var length = data.byteLength;
                var uint8Data = [];
                for (var i = 0; i < length; i++) {
                    uint8Data.push(data.getUint8(i));
                }
                callback && callback(uint8Data);
            },
            function(errorCode){
                AnyBoard.Logger.error("Could not subscribe to notifications", token);
            });

    };

    /*
     * Not used method stub. Should be functional
     */
    emulator._unsubscribe = function(token, win, fail)
    {
        evothings.ble.writeDescriptor(
            token.device.deviceHandle,
            token.device.descriptors['00002911-0000-1000-8000-00805f9b34fb'].handle,
            new Uint8Array([0,0])
        );

        evothings.ble.disableNotification(
            token.device.deviceHandle,
            token.device.characteristics['00002910-0000-1000-8000-00805f9b34fb'].handle,
            function(data){ success && success(data); },
            function(errorCode){ fail && fail(errorCode); }
        );
    };

    emulator.initialize = function(token) {
        var handleReceiveUpdateFromToken = function(uint8array) {
            var command = uint8array[0];
            var strData = "";
            AnyBoard.Logger.debug("Initializing emulator: " + command);

            token.sendQueue.shift(); // Remove function from queue
            if (token.sendQueue.length > 0) {  // If there's more functions queued
                token.randomToken = Math.random();
                token.sendQueue[0]();  // Send next function off
            }
        };

        this._subscribe(token, handleReceiveUpdateFromToken);
    };

    emulator.rawSend = function(token, data, win, fail) {
        evothings.ble.writeCharacteristic(
            token.device.deviceHandle,
            token.device.serialChar,
            data,
            win,
            fail
        );
    };

    emulator.send = function(token, data, win, fail) {
        var self = this;

        if(!(token.device.haveServices)) {
            fail && fail('Token does not have services');
            return;
        }

        if (typeof data === 'string') {
            data = new Uint8Array(evothings.ble.toUtf8(data));
        }

        if(data.buffer) {
            if(!(data instanceof Uint8Array))
                data = new Uint8Array(data.buffer);
        } else if(data instanceof ArrayBuffer) {
            data = new Uint8Array(data);
        } else {
            AnyBoard.Logger.warn("send data is not an ArrayBuffer.", this);
            return;
        }

        if (data.length > 20) {
            AnyBoard.Logger.warn("cannot send data of length over 20.", this);
            return;
        }

        if (token.sendQueue.length === 0) {  // this was first command
            token.sendQueue.push(function(){ emulator.rawSend(token, data, win, fail); });
            emulator.rawSend(token, data, win, fail);
        } else {
            // send function will be handled by existing
            token.sendQueue.push(function(){ emulator.rawSend(token, data, win, fail); });

            // Disregards existing queue if it takes more than 2000ms
            var randomToken = Math.random();
            token.randomToken = randomToken;

            setTimeout(function() {
                if (token.randomToken == randomToken) { // Queuehandler Hung up

                    token.sendQueue.shift(); // Remove function from queue
                    if (token.sendQueue.length > 0) {  // If there's more functions queued
                        token.sendQueue[0]();  // Send next function off
                    }
                }
            }, 2000);
        }

    };

})
