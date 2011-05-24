node-radius
===========

Node binding for freeradiusclient http://freeradius.org/freeradius-client/

Current Notes
-------------
You must first install the freeradiusclient libraries, and configure via radiusclient.conf.

Contributing
------------
Pull requests are welcome. Find bugs!

Dependencies
------------

Tested with Node >= v0.4.0

Installation
------------

To build, ensure the client libraries are installed, and

   npm install https://github.com/jeremycx/node-radius/tarball/master -g

Auth Example
------------
        var RADIUS = require("../RADIUS");
        var r = new RADIUS.Connection("/etc/radiusclient.conf");
        
        r.Auth({"user-name": "user1", 
                "password": "seCretPassword",
                "service-type": "framed-user"}, 

                function(res, data) {
                console.log("Result: "+res);
        });

Accounting Example
--------------------
        var RADIUS = require("../RADIUS");
        var r = new RADIUS.Connection("/etc/radiusclient.conf");
        
        r.Acct({"user-name":          "user1",
                "session-id":         r.GetID(),
                "acct-input-octets":  78264,
                "acct-output-octets": 77363},
                function(res) {
                console.log("Result: "+res);
        });


TODO:
-----
* Vendor-specific attributes

