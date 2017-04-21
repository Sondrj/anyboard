// JavaScript code for the BLE Peripheral example app.

var base64 = cordova.require('cordova/base64');

// Application object.
var app = {};

// Device list.
app.devices = {};

// UI methods.
app.ui = {};
// Emulator info
const NAME = "Emulator";
const VERSION = "0.1";
const UUID = "3191-6275-32g4";


// Status commands //TODO send en hexadesimal med statuskodene [32,33,34,64,65,66,67,68,71,72,73,74,136]
const  GET_NAME             = 32;
const  GET_VERSION          = 33;
const  GET_UUID             = 34;
const  HAS_LED              = 64;
const  HAS_LED_COLOR        = 65;
const  HAS_VIBRATION        = 66;
const  HAS_COLOR_DETECTION  = 67;
const  HAS_LED_SCREEN       = 68;
const  HAS_RFID             = 71;
const  HAS_NFC              = 72;
const  HAS_ACCELEROMETER    = 73;
const  HAS_TEMPERATURE      = 74;
const  READ_COLOR           = 136;

//Token-solo events
const  TAP				           = 201; //C9
const  DOUBLE_TAP		       = 202; //CA
const  SHAKE				         = 203; //CB
const  TILT                 = 204; //CC

//Token-constraint events
const  MOVE                 = 194; //C2 (+ 2nd and 3rd bytes for current and last sector)

//Token-token events
//TBD

//feedbacks
const  COUNT                = 205; //CD
const  DISPLAY_X            = 206; //CE
const  VIBRATE              = 200; //C8
const  DISPLAY_DIGIT		     = 207;
const  DISPLAY_W		   	     = 208;
const  DISPLAY_UP		       = 209;
const  DISPLAY_DOWN		     = 210;

const  LED_OFF2             = 128;
const  LED_ON2              = 129;
const  LED_BLINK            = 130;


function initialize()
{
	document.addEventListener('deviceready', this.onDeviceReady, false);

}

function onDeviceReady()
{	
	startServer(startAdvert());
}

function startServer(win)
{
	var settings = {
		onConnectionStateChange:function(deviceHandle, connected) {
			hyper.log("device "+deviceHandle+" "+(connected?"":"dis")+"connected");
		},
		services:[
			{
				// matching advert data.
				uuid:"00002220-0000-1000-8000-00805f9b34fb", //0000dead-0000-1000-8000-00805f9b34fb 
				type: 0,
				characteristics:[
					{
						// random uuid.
						uuid:"00002222-0000-1000-8000-00805f9b34fb", //  0000dea1-0000-1000-8000-00805f9b34fb
						handle:1,
						permissions:1|16, //PERMISSION_READ | PERMISSION_WRITE
						properties:2|8|16, // PROPERTY_READ | PROPERTY_WRITE | PROPERTY_NOTIFY
						writeType:2, // WRITE_TYPE_DEFAULT
						onReadRequest:function(deviceHandle, requestId) {
							hyper.log("hallo1");
							var data = new Uint8Array([0,0]);
							hyper.log("cr1 "+requestId+": "+evothings.ble.toUtf8(data));
							evothings.ble.peripheral.sendResponse(deviceHandle, requestId, data, function() {
								hyper.log("cr1 success");
							}, function(err) {
								hyper.log("cr1 fail: "+err);
							});
						},
						onWriteRequest:function(deviceHandle, requestId, data) {
							hyper.log("hallo2");
							hyper.log("cw1 "+requestId+":"+evothings.ble.toUtf8(data));
							evothings.ble.peripheral.sendResponse(deviceHandle, requestId, null, function() {
								hyper.log("cw1 success");
							}, function(err) {
								hyper.log("cw1 fail: "+err);
							});
						},
						descriptors:[
							// notification control.
							(function() {
								hyper.log("hallo3");
								var value = new Uint8Array([0,0]);
								return {
									uuid:'00002902-0000-1000-8000-00805f9b34fb',
									permissions:1|16,
									onReadRequest:function(deviceHandle, requestId) {
										hyper.log("hallo4");
										hyper.log("dr1 "+requestId);
										evothings.ble.peripheral.sendResponse(deviceHandle, requestId, value, function() {
											hyper.log("dr1 success");
										}, function(err) {
											hyper.log("dr1 fail: "+err);
										});
									},
									onWriteRequest:function(deviceHandle, requestId, data) {
										hyper.log("hallo5" + " DEVICEHANDLE: "+ deviceHandle);
										hyper.log("REQUESTID: " + requestId +" DATA_recieved: "+evothings.ble.toUtf8(data) +" Raw data:"+ data);
										value = evothings.ble.toUtf8(data);

										var valuestring = value.toString();
										var t = valuestring.split(",");
										var sendData ={};
										//var string = "91,66,64,100,99,54,102,102,52,50";
									
										for(var i = 0; i<t.length; i++ ) {
											sendData[0] = t[i];
											hyper.log("for: " + t[i]);
											switch(t[i]) {
												case GET_NAME:
											      send_string(deviceHandle,requestId,GET_NAME, NAME);
											      break;
											    case GET_VERSION:
											      send_string(deviceHandle,requestId,GET_VERSION, VERSION);
											      break;
											    case GET_UUID:
											      send_string(deviceHandle,requestId,GET_UUID, UUID);
											      break;
											    case HAS_LED:
											      sendData[1] = 1;
											      send_uint8(deviceHandle,requestId,sendData, 2);
											      break;
											    case HAS_LED_COLOR:
											      sendData[1] = 1;
											      send_uint8(deviceHandle,requestId,sendData, 2);
											      break;
											    case HAS_VIBRATION:
											      sendData[1] = 0;
											      send_uint8(deviceHandle,requestId,sendData, 2);
											      break;
											    case HAS_COLOR_DETECTION:
											      sendData[1] = 1;
											      send_uint8(deviceHandle,requestId,sendData, 2);
											      break;
											    case HAS_LED_SCREEN:
											      sendData[1] = 0;
											      send_uint8(deviceHandle,requestId,sendData, 2);
											      break;
											    case HAS_RFID:
											      sendData[1] = 0;
											      send_uint8(deviceHandle,requestId,sendData, 2);
											      break;
											    case HAS_NFC:
											      sendData[1] = 0;
											      send_uint8(deviceHandle,requestId,sendData, 2);
											      break;
											    case HAS_ACCELEROMETER:
											      sendData[1] = 0;
											      send_uint8(deviceHandle,requestId,sendData, 2);
											      break;
											    case HAS_TEMPERATURE:
											      sendData[1] = 0;
											      send_uint8(deviceHandle,requestId,sendData, 2);
											      break;
											    case VIBRATE:
											     // tokenFeedback.vibrate(getData[0] * 10);
											      send_uint8(deviceHandle,requestId,sendData, 1);
											      break;
											    case COUNT:
											      //tokenFeedback.displayCount();
											      send_uint8(deviceHandle,requestId,sendData, 1);
											      break;
											    case DISPLAY_X:
											      //tokenFeedback.displayX();
											      send_uint8(deviceHandle,requestId,sendData, 1);
											      break;
											    case DISPLAY_W:
											     // tokenFeedback.displayW();
											      send_uint8(deviceHandle,requestId,sendData, 1);
											      break;
											    case DISPLAY_UP:
											      //tokenFeedback.displayUp();
											      send_uint8(deviceHandle,requestId,sendData, 1);
											      break;
											    case DISPLAY_DOWN:
											      //tokenFeedback.displayDown();
											      send_uint8(deviceHandle,requestId,sendData, 1);
											      break;
											    case DISPLAY_DIGIT:
											      //tokenFeedback.displayDigit(getData[0]);
											      send_uint8(deviceHandle,requestId,sendData, 1);
											      break;
											    default:
											      sendData[0] = 0;
											      send_uint8(deviceHandle,requestId,sendData, 1);
											}
										}

										
										var array = base64.fromArrayBuffer(new Uint8Array([91,66,64,100,99,54,102,102,52,50])); //new Uint8Array([32,33,34,64,65,66,67,68,71,72,73,74,136]);
										hyper.log("Test av array: " + array);

										var the = evothings.ble.toUtf8(array);
										hyper.log("toUtf8value: "+ the);

										
										evothings.ble.peripheral.sendResponse(deviceHandle, requestId, data, function() {
											hyper.log("dw1 success");
										}, function(err) {
											hyper.log("dw1 fail: "+err);
										});
									},
								}
							})(),
							// characteristic description.
							{
								uuid:'00002901-0000-1000-8000-00805f9b34fb',
								permissions:1 , //READ, 
								onReadRequest:function(deviceHandle, requestId) {
									hyper.log("hallo6");
									var data = evothings.ble.toUtf8("customThing");
									hyper.log("dr3 "+requestId+": "+evothings.ble.toUtf8(data));
									evothings.ble.peripheral.sendResponse(deviceHandle, requestId, data, function() {
										hyper.log("dr3 success");
									}, function(err) {
										hyper.log("dr3 fail: "+err);
									});
								},
								// no write permission here. discard any incoming writes.
								onWriteRequest:function(deviceHandle, requestId, data) {
									hyper.log("hallo7");
									hyper.log("dw3 "+requestId+":"+evothings.ble.toUtf8(data));
									evothings.ble.peripheral.sendResponse(deviceHandle, requestId, data, function() {
										hyper.log("dw3 success");
									}, function(err) {
										hyper.log("dw3 fail: "+err);
									});
								},
							},
							// random uuid.
							(function() {
								var value = new Uint8Array([1,2,3,4]);
								return {
									uuid:'00002223-0000-1000-8000-00805f9b34fb',
									permissions:1|16,
									onReadRequest:function(deviceHandle, requestId) {
										hyper.log("hallo8");
										hyper.log("dr2 "+requestId);
										evothings.ble.peripheral.sendResponse(deviceHandle, requestId, value, function() {
											hyper.log("dr2 success");
										}, function(err) {
											hyper.log("dr2 fail: "+err);
										});
									},
									onWriteRequest:function(deviceHandle, requestId, data) {
										hyper.log("hallo9");
										hyper.log("dw2 "+requestId+":"+evothings.ble.toUtf8(data));
										value = data;
										evothings.ble.peripheral.sendResponse(deviceHandle, requestId, null, function() {
											hyper.log("dw2 success");
										}, function(err) {
											hyper.log("dw2 fail: "+err);
										});
									},
								}
							})(),
						],	//descriptors
					},
				],	//characteristics
			},
		],	//services
	};

	evothings.ble.peripheral.stopGattServer(function() {
		hyper.log("GATT server already started!?!");
	}, function(err) {
		hyper.log(err+", as expected");
		evothings.ble.peripheral.startGattServer(settings, function() {
			hyper.log("GATT server started successfully.");
			win();
		}, function(err) {
			hyper.log("GATT server start error: "+err);
		});
	});
}
function send_uint8(deviceHandle,requestId,data,length) {
	var sData = {};

	for(var i = 0; i<length; i++) {
		sData[i] = data[i];
	}
	sendResponse(deviceHandle,requestId,sData);
}
function send_string(deviceHandle,requestId,cmd, data) {
	var cmdData = {};
	cmdData[0] = cmd;
	for(var i = 0; i< data.length; i++) {
		cmdData[i+1] = data[i];
	}
	send_uint8(deviceHandle,requestId, cmdData, data.length);
}

function sendResponse(deviceHandle,requestId, data) {
	evothings.ble.peripheral.sendResponse(deviceHandle,requestId,data, function() {
		hyper.log("Reponse sent");
	}, function(err) {
		hyper.log("Response Not sent: "+ err);
	});
}

function startAdvert()
{
	stopAdvert();

	var data = {
		includeDeviceName:true,
		//includeTxPowerLevel:true,
		//serviceUUIDs:["00001234-0000-1000-8000-00805f9b34fb", "5678abcd-0000-1000-8000-00805f9b34fb"],
		serviceUUIDs:["00002220-0000-1000-8000-00805f9b34fb"],
		//serviceData:{"7d444841-9dc0-11d1-b245-5ffdce74fad2":base64.fromArrayBuffer(new Uint8Array([6,7,8,9,0]))},
		manufacturerData:{"42":base64.fromArrayBuffer(new Uint8Array([1,2,3,4,5]))},
	};

	var scanRespData = {
		//includeDeviceName:false,
		//includeTxPowerLevel:true,
		serviceUUIDs:["deaddead-0000-1000-8000-00805f9b34fb"],
		//serviceData:{"7d444841-9dc0-11d1-b245-5ffdce74fad2":base64.fromArrayBuffer(new Uint8Array([6,7,8,9,0]))},
		serviceData:{"0000dead-0000-1000-8000-00805f9b34fb":base64.fromArrayBuffer(new Uint8Array([6,7,8,9,0]))},
		//manufacturerData:{"42":base64.fromArrayBuffer(new Uint8Array([1,2,3,4,5]))},
	};

	var settings = {
		advertiseMode:"ADVERTISE_MODE_BALANCED",
		connectable:true,
		//timeoutMillis:0,
		txPowerLevel:"ADVERTISE_TX_POWER_HIGH",
		broadcastData:data,
		//scanResponseData:scanRespData,
	};

	evothings.ble.peripheral.startAdvertise(settings,
		function()
		{
			hyper.log("Advertise started.");
		},
		function(errorCode)
		{
			hyper.log("startAdvertise failed: "+errorCode);
		}
	);
}

// Stop scanning for devices.
function stopAdvert()
{
	evothings.ble.peripheral.stopAdvertise();
}