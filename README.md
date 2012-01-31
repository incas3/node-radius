node-radius
===========

Node binding for freeradiusclient http://freeradius.org/freeradius-client/

Current Notes
-------------

You must first install the freeradiusclient libraries. On new systems I sometimes
also had the error:

`libfreeradius-client.so.2: cannot open shared object file: No such file or directory`

This can be fixed by running the command `ldconfig /usr/local/lib` as root (YMMV).

I also used the latest freeradiusclient libraries from CVS, as they contain some 
patches not found in 1.1.6 archive available for download. Also I applied a patch
from http://freeradius.1045715.n5.nabble.com/Patch-avpair-c-empty-reply-VALUE-PAIR-0x0-for-replies-with-unknown-vendor-attributes-td2794477.html#a28888431
which fixed an issue I encountered with "unknown" attributes causing the entire
attribute list to be empty.

It is also worth noting that the dictionary files provided with "freeradius-server" 
are **NOT** compatible with the freeradius-client. The man page for dictionary files at
http://freeradius.org/radiusd/man/dictionary.html describes the format:

> ATTRIBUTE name number type [vendor|options]
>
> Define a RADIUS attribute name to number mapping. The name field can be any non-space text, but is usually taken from RFC2865, and other related documents. The number field is also taken from the relevant documents, for that name. The type field can be one of string, octets, ipaddr, integer, date, ifid, ipv6addr, ipv6prefix, or ether abinary. See the RFC's, or the main dictionary file for a description of the various types.
>
> The last (optional) field of an attribute definition can have either a vendor name, or options for that attribute. When a vendor name is given, the attribute is defined to be a vendor specific attribute.

Note that the page does not include any reference to the "BEGIN-VENDOR vendor" and "END-VENDOR vendor" lines used extensively in freeradius-server.
However:

  * **freeradius-client** REQUIRES the "vendor" field and fails loading if the "options" are used. Also it fails to recognise (but doesn't fail on) "BEGIN-VENDOR vendor" and "END-VENDOR vendor" lines.
  * **freeradius-server** will FAIL to load if it encounters the "vendor" field and REQUIRES the "VENDOR-START vendor" and "VENDOR-END vendor" to be in place.

Therefore, to use vendor attributes with the client, you must ensure that you add the vendor name after all attributes listed in the dictionary before you `$INCLUDE` it.

Contributing
------------

Pull requests are welcome. Find bugs!

Dependencies
------------

Updated for node version 0.6.9

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

* Extra libs for Session Management Javascript
* More Testing against given freeradius-server configuration.

