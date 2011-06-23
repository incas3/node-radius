node-radius
===========

Node binding for freeradiusclient http://freeradius.org/freeradius-client/

Current Notes
-------------

You must first install the freeradiusclient libraries.

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

        var RADIUS = require("RADIUS");
	/**
         *  All the configuration variables are optional, defaults shown below
         */
        var r = new RADIUS.Client({
            auth_order:      "radius",
            radius_deadtime: "0",
            radius_retries:  "3",
            dictionary:      "/usr/local/etc/radiusclient/dictionary",
            seqfile:         "/var/run/radiusclient.seq",
            radius_timeout:  "5",
            authserver:      "localhost:1812:secret",
            acctserver:      "localhost:1813:secret",
            poolsize:        10
        });
        
        r.Auth({"user-name": "user1", 
                "password": "seCretPassword",
                "service-type": "framed-user"}, 

                function(res, data) {
                console.log("Result: "+res);
        });

Accounting Example
--------------------

        var RADIUS = require("RADIUS");
        var r = new RADIUS.Client();
        
        r.Acct({"user-name":          "user1",
                "session-id":         "unique-session-id!",
                "acct-input-octets":  78264,
                "acct-output-octets": 77363},
                function(res) {
                console.log("Result: "+res);
        });


TODO:
-----

* Vendor-specific attributes
* Test harness for radiusd required for proper testing
* Extra libs for Session Management and Accounting Queue
