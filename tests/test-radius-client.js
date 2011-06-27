
var Radius = require("../lib/RADIUS.js");

var radius_client = new Radius.Client();

var user_vsa = {"user-name": "testuser2", "password": "testpass", "service-type": "framed-user"};
var user_no_vsa = {"user-name": "testuser", "password": "testpass", "service-type": "framed-user"};

var expected_vsa = [0, [["Service-Type", "Framed-User"], ["Reply-Message", "Nomadix VSA Attribute"], ["Nomadix-Bw-Down", "1024"]] ];
var expected_no_vsa = [0, [["Service-Type", "Framed-User"], ["Reply-Message", "No VSA Attributes"]] ];

var tests = [
    { name: "Request expects no VSA in Response",
	  attrs: user_no_vsa,
	  radius: radius_client,
	  expected: expected_no_vsa },
	{ name: "Radius with VSA Dictionary, Request expects VSA in Response",
	  attrs: user_vsa,
	  radius: radius_client,
	  expected: expected_vsa }
];


require('./tester')(tests);
