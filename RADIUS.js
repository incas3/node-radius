var RADBinding = require("./build/default/radius-ng");
var fs = require('fs');

var Session = function() {
    var self = this;
    var session = new Date().getTime();
    var pid = process.pid;
    var counter = 0;

    self.GetID = function() {
        return "" + session + pid + counter++;
    }
}

var RADConnection = function(cfg) {
    var self = this;
    var bindings = [];
    var configfile = cfg;
    var session = new Session();

    self.maxbindings = 100;
    self.reapinterval = 60000;

    self.GetFreeBinding = function() {
        for (var i = 0 ; i < bindings.length ; i++) {
            if (!bindings[i].Busy()) {
                return bindings[i];
            }
        }
        var binding = new RADBinding.Radius();
        binding.InitRadius(configfile);
        bindings.push(binding);
        return binding;
    }

    self.GetID = function() {
        return session.GetID();
    }

    self.Send = function(attrs, isAuth, CB) {
        var binding = self.GetFreeBinding();
        var attrindex;

        for (attr in attrs) {
            if (attr.indexOf("_") != 0) {
                binding.AvpairAdd(attr, attrs[attr]);
            }
        }

        if (isAuth) {
            binding.Auth(CB);
        } else {
            binding.Acct(CB);
        }
    }

    self.Auth = function(attrs, CB) {
        self.Send(attrs, 1, CB);
    }

    self.CheckSessionID = function(attrs) {
        if ((!attrs['Acct-Session-Id']) &&
            (!attrs['Acct-Session-ID']) &&
            (!attrs['acct-session-id']) ) {
            throw new Error("No Session ID provided");
        }
    }

    self.Acct = function(attrs, CB) {
        self.CheckSessionID(attrs);
        self.Send(attrs, 0, CB);
    }

    self.Reaper = function() {
        if (bindings.length < self.maxbindings) {
            return;
        }
        for (var i = 0 ; i < bindings.length ; i++) {
            if (!bindings[i].Busy()) {
                bindings.splice(i, 1);
                i--;
            }
        }
    }

    setInterval(self.Reaper, self.reapinterval);

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

    var RunInterval = 10000;
    var SaveInterval = 60000;
    
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

    self.WriteQueue = function() {
        console.log("Writing Queue");

        var b = new Buffer(JSON.stringify(queue), encoding='utf8');
        
        fs.open(backingfile, "w+", 0600, function(err, fd) {
            if (!err) {
                fs.write(fd, b, 0, b.length, 0, function() {
                    fs.close(fd);
                });
            }
        });
    }

    self.QueueRun = function() {
        if (current = queue.shift()) {
            try {
                current['Acct-Delay-Time'] = Math.round((new Date().getTime() - current._submittime) / 1000);
                connection.Acct(current, function(err, data) {
                    if (err) {
                        queue.unshift(current);
                    } else {
                        self.QueueRun();
                    }
                });
            } catch (err) {
                // this catch is for connection.Acct. If an error is thrown,
                // do nothing, as this is caused by a bad request, not a network
                // problem. Especially don't unshift back to the queue. 
            }
        } else {
            // nothing left.
            setTimeout(self.QueueRun, RunInterval);
        }
    }

    self.Run = function() {
        // start up the queue
        self.QueueRun();
    }

    self.SetRunInterval = function(i) {
        RunInterval = i;
    }

    self.Add = function(rec) {
        rec._submittime = new Date().getTime();
        // we require a Session-ID since it's our only way of catching
        // slow ACKs.
        connection.CheckSessionID(rec);
        queue.push(rec);
    }

    self.Exit = function() {
        self.WriteQueue();
        process.exit(0);
    }

    setInterval(self.WriteQueue, SaveInterval);
    process.on("SIGINT", self.Exit);
    process.on("SIGTERM", self.Exit);
    process.on("SIGQUIT", self.Exit);
    process.on("SIGABRT", self.Exit);
}

exports.Connection = RADConnection;
exports.AccountingQueue = AccountingQueue;
exports.Session = Session;