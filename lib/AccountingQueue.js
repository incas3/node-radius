/* 
 * The Accounting Queue is a safe way to transmit
 * accounting records to the server.
 * once an accounting record is added to the queue, then
 * the queue will retry the send until successful.
 * 
 * The queue itself is saved to disk periodically
 *
 */

var fs = require('fs');

var AccountingQueue = function(backingfile, conn) {
    var self = this;
    var bf = backingfile;
    var connection = conn;
    var current;

    var runInterval = 10000;
    var saveInterval = 60000;

    self.queue = [];
    
    try {
        // OK to be sync, only happens at startup, and we want to know
        // this is loaded before proceeding.
        var dummy = fs.readFileSync(backingfile, 'utf8');
        if (dummy) {
            self.queue = JSON.parse(dummy);
        }
    } catch (e) {
        // it's OK if we can't read the file.
    }

    function log() {
        return;
    }

    self.setLog = function(logfunc) {
        log = logfunc;
        log("Log set");
    }

    self.writeQueue = function(exit) {
        var b = new Buffer(JSON.stringify(self.queue), encoding='utf8');
        
        fs.open(backingfile, 'w+', 0600, function(err, fd) {
            if (!err) {
                fs.write(fd, b, 0, b.length, 0, function() {
                    log('Wrote queue to ' + backingfile);
                    fs.close(fd);
                    if (exit) {
                        process.exit(0);
                    }
                });
            }
        });
    }

    function queueRun() {
        log("Serving queue - length " + self.queue.length);
        if (current = self.queue.shift()) {
            current._tries++;
            try {
                current['Acct-Delay-Time'] = Math.round((new Date().getTime() - current._submittime) / 1000);
                log('Sending packet (try ' + current._tries + ')');
                connection.Acct(current, function(err) {
                    if (err) {
                        log('Error sending packet try ' + current._tries + ' storing for retry');
                        self.queue.push(current);
                    } else {
                        log('Packet sent successfully');
                        // nextTick allows us to do this all again, but allow this binding
                        // so finish and become free.
                    }
                    process.nextTick(queueRun);
                });
            } catch (err) {
                // this catch is for connection.Acct. If an error is thrown,
                // do nothing, as this is caused by a bad request, not a network
                // problem. Especially don't unshift back to the queue. 
                log(err + ' invalid format');
                setTimeout(self.queueRun, runInterval);
            }
        } else {
            // nothing left in queue.
            setTimeout(queueRun, runInterval);
        }
    }

    self.run = function() {
        // start up the queue
        log('Starting queue');
        queueRun();
    }

    self.setRunInterval = function(i) {
        runInterval = i;
    }

    self.add = function(rec) {
        rec._submittime = new Date().getTime();
        // we require a Session-ID since it's our only way of catching
        // slow ACKs.
        rec._tries = 0;
        self.queue.push(rec);
    }

    self.Exit = function() {
        self.writeQueue(true);
    }

    setInterval(self.writeQueue, saveInterval);
    process.on('SIGINT', self.Exit);
    process.on('SIGTERM', self.Exit);
    process.on('SIGQUIT', self.Exit);
    process.on('SIGABRT', self.Exit);
}

module.exports.AccountingQueue = AccountingQueue;