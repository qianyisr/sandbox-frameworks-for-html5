cordova.define('cordova/plugin_list', function(require, exports, module) {
	module.exports = [
		{
			"file": "../plugins/inAppBrowser/inAppBrowser.js",
			"id": "org.apache.cordova.inappbrowser.InAppBrowser",
			"clobbers": [
				"window.open"
			]
		},
		{
	        "file": "../plugins/network/network.js",
	        "id": "org.apache.cordova.network-information.network",
	        "clobbers": [
	            "navigator.connection",
	            "navigator.network.connection"
	        ]
	    },
	    {
	        "file": "../plugins/network/Connection.js",
	        "id": "org.apache.cordova.network-information.Connection",
	        "clobbers": [
	            "Connection"
	        ]
	    },
		{
			"file": "../plugins/device/device.js",
	        "id": "org.apache.cordova.device.device",
	        "clobbers": [
	            "device"
	        ]
		}
	];
	module.exports.metadata =
	// TOP OF METADATA
	{
	    "org.apache.cordova.device": "0.2.8",
	    "org.apache.cordova.inappbrowser": "0.3.1"
	}
	// BOTTOM OF METADATA
});