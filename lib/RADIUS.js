/**
 * node-radius Radius client module.
 *
 * The heavy lifting is done by the C++ module
 * in `../src/radius-ng.cc`
 *
 * We just provide a nice interface and sane defaults.
 */
var freeradius_client = require("../build/default/radius-ng"),
     sys = require('sys');
/**
 *  Server Connection Defaults
 */
var defaults = {
    /**
     *  first for the radiusclient
     */
    auth_order: "radius",
    dictionary: "/usr/local/etc/radiusclient/dictionary",
    seqfile: "/var/run/radiusclient.seq",
    radius_timeout: "5",
    radius_deadtime: "0",
    radius_retries: "3",
    authserver: "127.0.0.1:1812:testing123",
    acctserver: "127.0.0.1:1813:testing123",
    /**
     *  now for our pool
     */
    poolsize: 10 //how many binding to instantiate
};

// Response codes:
var response_codes = {
    "-2": "Bad Response",
    "-1": "Error",
     "0": "OK",
     "1": "Timed Out",
     "2": "Rejected"
};

//just for debugging...
var _debug = function(what){
	if(typeof(exports.debug) == 'function'){
		exports.debug(what);
	}
}
//quick an dirty implementation
var dirtydebug = function(what){ sys.puts("RADIUS DEBUG: "+sys.inspect(what)); };

/**
 *  A Connection pool.
 */
var ConnectionPool = function ConnectionPool(config){
    //ensure config is an object!
    config = config||{}
    // make a nice self reference
    var self = this;
    // To hold the connections.
    var pool = [];
    // last used connection
    var last_connection = 0;
    // Configuration
    var radius_cfg = {
        auth_order: conf("auth_order", config),
        dictionary: conf("dictionary", config),
        seqfile: conf("seqfile", config),
        radius_timeout: conf("radius_timeout", config),
        radius_deadtime: conf("radius_deadtime", config),
        radius_retries: conf("radius_retries", config),
        authserver: conf("authserver", config),
        acctserver: conf("acctserver", config)
    };
    //Maximum pool size.
    var max_pool_size = conf("poolsize", config);   
    
    //we want to track this so we don't exit until they have all finished!
    var working_connections = 0;
    
    _debug("Radius Config:");
    _debug(radius_cfg);
    
    // check config key and return it or default.
    function conf(key, config){
        return config[key] || defaults[key];
    };

    //get a free connection from the pool, takes a callback function as we may 
    //have to wait
    function getConnection(cb){
        var i = 0;
        while(i < pool.length){
            if(!pool[i].busy()){
                return cb(pool[i]);
            }
            i++;
        }
        _debug("All connections busy, pool size: "+pool.length+", max pool size: "+max_pool_size);
        //if here no free connections in the pool, so if we are allowed, make a new one.
        if( pool.length < max_pool_size ){
            _debug("creating new connection");
            try{
                var conn = createNewConnection();
                pool.push(conn);
                _debug("New Connection added to pool");
                return cb(conn);
            }catch(e){
                _debug(e.message);
                //what to do now!
                throw new Error(e.message);
            }
        }
        //if here, then we can't do it!, so wait a fraction of a second and try again.
        //this negates the need for the "reaper" in the original implementation
        // @TODO should we count these and die if none ever frees up?
        var callback = cb;
        _debug("waiting for available connection...");
        setTimeout(function(){ getConnection(callback); }, 50);
    };  
    
    //Create a new connection
    function createNewConnection(){
        //initialise
        var conn = new freeradius_client.Radius();
        conn.initRadius();
        //add configuration
        for(var attr in radius_cfg){
            _debug("Adding attribute: "+attr+": "+radius_cfg[attr]);
            conn.configAdd(attr, radius_cfg[attr]);
        }
        //read in dictionary, surely this could take a while, but not possible to
        //async this in javascript here!
        _debug("Reading Dictionary");
        conn.readDictionary();
        //return the connection
        return conn;
    };
    
    //add attributes for a request
    function addAttributes(attrs, conn){
        for( var attr in attrs){
            if( attr.indexOf("_") !== 0) {
                _debug("Adding Attributes to message: "+attr+": "+attrs[attr]);
                conn.avpairAdd(attr, attrs[attr]);
            }
        }
    };

    // An Authentication Request, with callback function
    // which recieves "response_code" and "attributes"
    // 
    // response codes are: -2: bad response
    //                     -1: error response
    //                      0: OK
    //                      1: timeout
    //                      2: rejected
    self.Auth = function Auth(attrs, cb){
        _debug("Authentication Request for "+attrs["user-name"]);
        request("auth", attrs, cb);
    };
    
    //An Accounting request, with callback function
    // the callback receives only the response code (see above)
    self.Acct = function Acct(attrs, cb){
        //quick check for session id!
        if(
            !(attrs['Acct-Session-Id'] || 
              attrs['Acct-Session-ID'] || 
              attrs['acct-session-id'])
        ){
            throw new Error('Session ID is required but not provided in Accounting Request');
        }
        //now make request.
        _debug("Accounting Request");
        request("acct", attrs, cb);
    }
  
    // This actually makes the requests
    function request(type, attrs, cb){
        var attribs = attrs;
        var callback = function(){
            //lower the number of connections.
            _debug("Connection finished!");
            working_connections--;
            args = Array.prototype.slice.call(arguments);
            //call the callback.
            cb.apply(self, args);
        }
        var method = type;
        if(method === "acct" || method === "auth"){
            return getConnection(function(conn){
                _debug("Adding request attributes");
                addAttributes(attribs, conn);
                working_connections++;
                if(method === "acct"){
                    _debug("Sending Acct");
                    conn.acct(callback);
                }else{
                    _debug("Sending Auth");
                    conn.auth(callback);
                }
            });
        }
        throw new Error("Unknown request method type: "+type);
    };
    
    //Close the connection pool (wait for requests);
    self.Close = function Close(){
        if(working_connections > 0){
            //try again shortly.
            _debug("still connections ("+working_connections+")...");
            setTimeout(Close, 1000);
        }
        return;
    };
};

//Now expose only the minimum to the user:
exports.Client = ConnectionPool;
exports.RESPONSE_CODES = response_codes;
exports.debug = function(){};
exports.dirty = dirtydebug;
