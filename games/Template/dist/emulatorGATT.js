
var base64 = cordova.require('cordova/base64');

function startAdvert() {
	
	stopAdvert();
	// Data which is advertised
	var data = {
		includeDeviceName: true,
		serviceUUIDs: ["fe800bf1-43ce-4505-9ed7-2a2dcb266ef3"],
	};

	var settings = {
		advertiseMode: "ADVERTISE_MODE_BALANCED", // Optional
		txPowerLevel: "ADVERTISE_TX_POWER_HIGH", // Optional
		broadcastData: data 					 //Required
	}

	evothings.ble.peripheral.startAdvertise(settings, 
		function() {
			hyper.log("Advertise started.");
		},
		function(error) {
			hyper.log("Start advertise FAILED: " + error);
		}
	);
}

function stopAdvert() {
	evothings.ble.peripheral.stopAdvertise();
}

function startServer(win) {

	var settings = {
		onConnectionStateChange: function(deviceHandle,connected) {
			hyper.log("device "+ deviceHandle+ " "+ (connected?"":"dis")+"connected");
		},
		services:[
			{
				uuid: "0000dead-0000-1000-8000-00805f9b34fb",  // fe800bf1-43ce-4505-9ed7-2a2dcb266ef3
				type: 0,
				characteristics: [
					{
						uuid: "deaddead-0000-1000-8000-00805f9b34fb", // c1f64b36-6715-49b5-ad49-9d65a2e77a93
						handle: 1,
						permissions: 1 | 16, //PERMISSION_READ | PERMISSION_WRITE
						properties: 2 | 8 | 16, // PROPERTY_READ | PROPERTY_WRITE | PROPERTY_NOTIFY
						writeType: 2, // WRITE_TYPE_DEFAULT
						onReadRequest: function(deviceHandle, requestId) {
							var data = new Uint8Array([6,7,8,9,0]);
							hyper.log("console read 1 " + requestId + ": " + evothings.util.typedArrayToHexString(data));
							evothings.ble.sendResponse(deviceHandle,requestId, data, function() {
								hyper.log("cr1 success");
							}, function(error) {
								hyper.log("cr1 fail: " + error);
							});
						},
						onWriteRequest: function(deviceHandle, requestId, data) {
							hyper.log("console write 1 " + requestId + evothings.util.typedArrayToHexString(data));
							evothings.ble.sendResponse(deviceHandle,requestId,null, function() {
								hyper.log("cw1 success");
							}, function(error) {
								hyper.log("cw1 fail: " + error);
							});
						},
						descriptors: [
							//notification control
							(function() {
								var value = new Uint8Array([0,0]);
								return {
									uuid: '00002911-0000-1000-8000-00805f9b34fb', // change 2902??
									permissions: 1 | 16, //PERMISSION_READ | PERMISSION_WRITE
									onReadRequest: function() {

									},
									onWriteRequest: function() {

									},
								}
							})(),

							// characteristic description
							{
								uuid: '00002910-0000-1000-8000-00805f9b34fb', // change 2901 ??
								permissions: 1, // PERMISSION_READ
								onReadRequest: function() {

								},
								onWriteRequest: function() {

								},
							},

							(function() {
								var value = new Uint8Array([1,2,3,4]);
								return {
									uuid:'',
									permissions: 1 | 16, // PERMISSION_READ | PERMISSION_WRITE
									onReadRequest: function() {

									},
									onWriteRequest: function() {

									},
								}
							})(),
						], //Descriptors
					},
				], // characteristics
			},
		], //services
	}; // end settings


	evothings.ble.peripheral.stopGattServer(function() {
		hyper.log("GATT server already started.");
	}, function(error) {
		AnyBoard.Logger(error + " as expected.");
		evothings.ble.peripheral.startGATTServer(settings,function() {
			hyper.log("GATT server started successfully.");
			win();
		}, function(error) {
			hyper.log("GATT server start ERROR: "+ error);
		});
	});

}
