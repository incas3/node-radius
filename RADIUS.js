var RADBinding = require("./build/default/radius-ng");
var fs = require('fs');

var Session = function() {
    var self = this;
    var session = new Date().getTime();
    var pid = process.pid;
    var counter = 0;

    self.genID = function() {
        return "" + session + pid + counter++;
    }
}

var RADConnection = function(cfg) {
    var self = this;
    var bindings = [];
    var rconfig = cfg;
    var session = new Session();

    self.maxbindings = 100;
    self.reapinterval = 60000;

    self.getFreeBinding = function() {
        for (var i = 0 ; i < bindings.length ; i++) {
            if (!bindings[i].busy()) {
                return bindings[i];
            }
        }
        var binding = new RADBinding.Radius();
        binding.initRadius();

        for (var attr in rconfig) {
            binding.configAdd(attr, rconfig[attr]);
        }
        binding.readDictionary();

        bindings.push(binding);
        return binding;
    }

    self.genID = function() {
        return session.genID();
    }

    self.send = function(attrs, isAuth, CB) {
        var binding = self.getFreeBinding();
        var attrindex;

        for (attr in attrs) {
            if (attr.indexOf("_") != 0) {
                binding.avpairAdd(attr, attrs[attr]);
            }
        }

        if (isAuth) {
            binding.auth(CB);
        } else {
            binding.acct(CB);
        }
    }

    self.auth = function(attrs, CB) {
        self.send(attrs, 1, CB);
    }

    self.checkSessionID = function(attrs) {
        if ((!attrs['Acct-Session-Id']) &&
            (!attrs['Acct-Session-ID']) &&
            (!attrs['acct-session-id']) ) {
            throw new Error("No Session ID provided");
        }
    }

    self.acct = function(attrs, CB) {
        self.checkSessionID(attrs);
        self.send(attrs, 0, CB);
    }

    self.reaper = function() {
        if (bindings.length < self.maxbindings) {
            return;
        }
        for (var i = 0 ; i < bindings.length ; i++) {
            if (!bindings[i].busy()) {
                bindings.splice(i, 1);
                i--;
            }
        }
    }

    setInterval(self.reaper, self.reapinterval);

}

/* 
 * The Accounting Queue is a safe way to transmit
 * accounting records to the server.
 * once an accounting record is added to the queue, then
 * the queue will retry the send until successful.
 * 
 * The queue itself is saved to disk periodically
 *
 */

var AccountingQueue = function(backingfile, conn) {
    var self = this;
    var bf = backingfile;
    var queue = [];
    var session = new Session();
    var connection = conn;
    var current;

    var runInterval = 10000;
    var saveInterval = 60000;
    
    try {
        // OK to be sync, only happens at startup, and we want to know
        // this is loaded before proceeding.
        var dummy = fs.readFileSync(backingfile, "utf8");
        if (dummy) {
            queue = JSON.parse(dummy);
        }
    } catch (e) {
        // it's OK if we can't read the file.
    }

    self.writeQueue = function(exit) {
        var b = new Buffer(JSON.stringify(queue), encoding='utf8');
        
        fs.open(backingfile, "w+", 0600, function(err, fd) {
            if (!err) {
                fs.write(fd, b, 0, b.length, 0, function() {
                    fs.close(fd);
                    if (exit) {
                        process.exit(0);
                    }
                });
            }
        });
    }

    self.queueRun = function() {
        if (current = queue.shift()) {
            try {
                current['Acct-Delay-Time'] = Math.round((new Date().getTime() - current._submittime) / 1000);
                connection.acct(current, function(err, data) {
                    if (err) {
                        queue.unshift(current);
                    } else {
                        self.queueRun();
                    }
                });
            } catch (err) {
                // this catch is for connection.Acct. If an error is thrown,
                // do nothing, as this is caused by a bad request, not a network
                // problem. Especially don't unshift back to the queue. 
            }
        } else {
            // nothing left.
            setTimeout(self.queueRun, runInterval);
        }
    }

    self.run = function() {
        // start up the queue
        self.queueRun();
    }

    self.setRunInterval = function(i) {
        runInterval = i;
    }

    self.add = function(rec) {
        rec._submittime = new Date().getTime();
        // we require a Session-ID since it's our only way of catching
        // slow ACKs.
        connection.checkSessionID(rec);
        queue.push(rec);
    }

    self.Exit = function() {
        self.writeQueue(true);
    }

    setInterval(self.writeQueue, saveInterval);
    process.on("SIGINT", self.Exit);
    process.on("SIGTERM", self.Exit);
    process.on("SIGQUIT", self.Exit);
    process.on("SIGABRT", self.Exit);
}

exports.Connection = RADConnection;
exports.AccountingQueue = AccountingQueue;
exports.Session = Session;