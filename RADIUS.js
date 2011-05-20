var RADBinding = require("./build/default/radius-ng");

var RADConnection = function(cfg) {
    var self = this;
    var bindings = [];
    var configfile = cfg;
    
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

    self.Send = function(attrs, isAuth, CB) {
        var binding = self.GetFreeBinding();

        // add the attrs
        for (attr in attrs) {
            if (typeof(attrs[attr]) == 'string') {
                binding.AvpairAddStr(attr, attrs[attr]);
            } else if (typeof(attrs[attr]) == 'number') {
                binding.AvpairAddInt(attr, attrs[attr]);
            } else {
                throw new Error("Unknown data type: "+typeof(attrs[attr]));
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

    self.Acct = function(attrs, CB) {
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

exports.Connection = RADConnection;