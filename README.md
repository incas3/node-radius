node-radius
===========

Node binding for freeradiusclient http://freeradius.org/freeradius-client/

Current Notes
-------------
You must first install the freeradiusclient libraries, and configure via radiusclient.conf.

Dictionary based handling of attributes is not supported (coming soon).

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
        var r = new RADIUS.Connection("/usr/local/etc/radiusclient-ng/radiusclient.conf");
        
        r.Auth({1: "user1", 2: "seCretPassword", 6:8 }, function(res)
        {
                console.log("Result: "+res);
        });

Accounting Example
--------------------
        var RADIUS = require("../RADIUS");
        var r = new RADIUS.Connection("/usr/local/etc/radiusclient-ng/radiusclient.conf");
        
        r.Acct({1: "user1"}, function(res)
        {
                console.log("Result: "+res);
        });


The tests directory can be skimmed for more usage examples.

TODO:
-----
* better testing - lots of testing
* Dictionary handling/lookups
