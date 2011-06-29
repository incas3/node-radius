
var Radius = require("../lib/RADIUS.js");

var radius_client = new Radius.Client();

/*
 	Add this to your /etc/freeradius/users (or /etc/raddb/users if on RHEL)
	Also ensure you load the Nomadix Dictionaryin both server and client config

testuser        Cleartext-Password := "testpass"
                Service-Type = Framed-User,
                Reply-Message = "No VSAs"

testuser2       Cleartext-Password := "testpass"
                Service-Type = Framed-User,
                Reply-Message = "Nomadix VSA",
                Nomadix-Bw-Down = 1024,
                Nomadix-Bw-Up = 512
*/

var user_vsa = {"user-name": "testuser2", "password": "testpass", "service-type": "framed-user"};
var user_no_vsa = {"user-name": "testuser", "password": "testpass", "service-type": "framed-user"};

var expected_vsa = [0, {"Service-Type": ["Framed-User"], "Reply-Message": ["Nomadix VSA"], "Nomadix-Bw-Down": ["1024"], "Nomadix-Bw-Up":["512"]} ];
var expected_no_vsa = [0, {"Service-Type": ["Framed-User"], "Reply-Message": ["No VSAs"]} ];

var tests = [
    { name: "Request expects no VSA in Response",
	  attrs: user_no_vsa,
	  radius: radius_client,
	  expected: expected_no_vsa },
	{ name: "Request expects VSA in Response",
	  attrs: user_vsa,
	  radius: radius_client,
	  expected: expected_vsa }
];


require('./tester')(tests);
