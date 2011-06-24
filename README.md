node-radius
===========

Node binding for freeradiusclient http://freeradius.org/freeradius-client/

Current Notes
-------------

You must first install the freeradiusclient libraries. On new systems I sometimes
also had the error:

`libfreeradius-client.so.2: cannot open shared object file: No such file or directory`

This can be fixed by running the command `ldconfig /usr/local/lib` as root.

Contributing
------------

Pull requests are welcome. Find bugs!

Dependencies
------------

Tested with Node >= v0.4.0

Installation
------------

To build, ensure the client libraries are installed, and

   npm install https://github.com/thechriswalker/node-radius/tarball/master -g

Usage Example
-------------

    /**
     *  Create a Client, you can pass an object with configuration options,
     *  if they differ from the defaults (see lib/RADIUS.js for defaults)
     */
    var RADIUS = require("RADIUS");
    var r = new RADIUS.Client();
    
    /**
     *  Authentication Example
     */
    r.Auth(
        {   "user-name":    "user1",
            "password":     "seCretPassword",
            "service-type": "framed-user" 
        }, 
        function(res, data){
            /**
             *  Note that you can turn the numeric value into a textual
             *  description with the `RADIUS.RESPONSE_CODES` object, e.g.
             */
            console.log("Radius Response: "+RADIUS.RESPONSE_CODES[res]);
            console.log("Attributes: ");
            console.log(data);
        }
    );
    
    /**
     *  Accounting Example
     */

    r.Acct(
        {   "user-name":          "user1",
            "session-id":         "unique-session-id!",
            "acct-input-octets":  78264,
            "acct-output-octets": 77363
        },
        function(res){ console.log("Result: "+RADIUS.RESPONSE_CODES[res]); }
    );


TODO:
-----

* Vendor-specific attributes: Currently even loading VENDOR attributes into the
  dictionary file will cause unexpected behaviour, as will recieving a response
  including VSAs whether the dictionary has them or not. I am currently confused
  by this... (help anyone? it must be with the C++ code with which I am a little
  green still)
* Extra libs for Session Management Javascript
* More Testing against given freeradius-server configuration.

