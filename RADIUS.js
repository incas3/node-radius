var RADBinding = require("./build/default/radius_binding");

var RADConnection = function() {
    var self = this;
    var binding = [];

    self.Open = function(type, parallel) {
        for (var i = 0 ; i < parallel ; i++) {
            binding[i] = new RADBinding.RADConnection();
            binding[i].Open(type);
            binding[i].addListener("response", function() {
                

            }
        }
    }

    self.AddServer = function(host, port, secret, timeout, retry) {
        binding.AddServer(host, port, secret, timeout, retry);
    }

    self.CreateRequest = function(type) {
        binding.CreateRequest(type);
    }

    self.PutStr = function(attr, val) {
        binding.PutStr(attr, val);
    }

    self.PutInt = function(attr, val) {
        binding.PutInt(attr, val);
    }

    self.SendRequest = function() {
        binding.SendRequest();
    }

    binding.addListener("response", function() {
        while (attr = binding.GetAttr()) {
            if (attr == 11) {
                console.log(attr + ":" + binding.ConvertAttrStr());
            } else if (attr == 62) {
                console.log(attr + ":" + binding.ConvertAttrInt());
            }
        }
    });

    self.RAD_ACCESS_REQUEST=1
    self.RAD_ACCESS_ACCEPT=2
    self.RAD_ACCESS_REJECT=3
    self.RAD_ACCOUNTING_REQUEST=4
    self.RAD_ACCOUNTING_RESPONSE=5
    self.RAD_ACCESS_CHALLENGE=11
    self.RAD_DISCONNECT_REQUEST=40
    self.RAD_DISCONNECT_ACK=41
    self.RAD_DISCONNECT_NAK=42
    self.RAD_COA_REQUEST=43
    self.RAD_COA_ACK=44
    self.RAD_COA_NAK=45
    self.RAD_USER_NAME=1
    self.RAD_USER_PASSWORD=2
    self.RAD_CHAP_PASSWORD=3
    self.RAD_NAS_IP_ADDRESS=4
    self.RAD_NAS_PORT=5
    self.RAD_SERVICE_TYPE=6
    self.RAD_LOGIN=1
    self.RAD_FRAMED=2
    self.RAD_CALLBACK_LOGIN=3
    self.RAD_CALLBACK_FRAMED=4
    self.RAD_OUTBOUND=5
    self.RAD_ADMINISTRATIVE=6
    self.RAD_NAS_PROMPT=7
    self.RAD_AUTHENTICATE_ONLY=8
    self.RAD_CALLBACK_NAS_PROMPT=9
    self.RAD_FRAMED_PROTOCOL=7
    self.RAD_PPP=1
    self.RAD_SLIP=2
    self.RAD_ARAP=3
    self.RAD_GANDALF=4
    self.RAD_XYLOGICS=5
    self.RAD_FRAMED_IP_ADDRESS=8
    self.RAD_FRAMED_IP_NETMASK=9
    self.RAD_FRAMED_ROUTING=10
    self.RAD_FILTER_ID=11
    self.RAD_FRAMED_MTU=12
    self.RAD_FRAMED_COMPRESSION=13
    self.RAD_COMP_NONE=0
    self.RAD_COMP_VJ=1
    self.RAD_COMP_IPXHDR=2
    self.RAD_LOGIN_IP_HOST=14
    self.RAD_LOGIN_SERVICE=15
    self.RAD_LOGIN_TCP_PORT=16
    self.RAD_REPLY_MESSAGE=18
    self.RAD_CALLBACK_NUMBER=19
    self.RAD_CALLBACK_ID=20
    self.RAD_FRAMED_ROUTE=22
    self.RAD_FRAMED_IPX_NETWORK=23
    self.RAD_STATE=24
    self.RAD_CLASS=25
    self.RAD_VENDOR_SPECIFIC=26
    self.RAD_SESSION_TIMEOUT=27
    self.RAD_IDLE_TIMEOUT=28
    self.RAD_TERMINATION_ACTION=29
    self.RAD_CALLED_STATION_ID=30
    self.RAD_CALLING_STATION_ID=31
    self.RAD_NAS_IDENTIFIER=32
    self.RAD_PROXY_STATE=33
    self.RAD_LOGIN_LAT_SERVICE=34
    self.RAD_LOGIN_LAT_NODE=35
    self.RAD_LOGIN_LAT_GROUP=36
    self.RAD_FRAMED_APPLETALK_LINK=37
    self.RAD_FRAMED_APPLETALK_NETWORK=38
    self.RAD_FRAMED_APPLETALK_ZONE=39
    self.RAD_ACCT_INPUT_GIGAWORDS=52
    self.RAD_ACCT_OUTPUT_GIGAWORDS=53
    self.RAD_CHAP_CHALLENGE=60
    self.RAD_NAS_PORT_TYPE=61
    self.RAD_ASYNC=0
    self.RAD_SYNC=1
    self.RAD_ISDN_SYNC=2
    self.RAD_ISDN_ASYNC_V120=3
    self.RAD_ISDN_ASYNC_V110=4
    self.RAD_VIRTUAL=5
    self.RAD_PIAFS=6
    self.RAD_HDLC_CLEAR_CHANNEL=7
    self.RAD_X_25=8
    self.RAD_X_75=9
    self.RAD_G_3_FAX=10
    self.RAD_SDSL=11
    self.RAD_ADSL_CAP=12
    self.RAD_ADSL_DMT=13
    self.RAD_IDSL=14
    self.RAD_ETHERNET=15
    self.RAD_XDSL=16
    self.RAD_CABLE=17
    self.RAD_WIRELESS_OTHER=18
    self.RAD_WIRELESS_IEEE_802_11=19
    self.RAD_PORT_LIMIT=62
    self.RAD_LOGIN_LAT_PORT=63
    self.RAD_CONNECT_INFO=77
    self.RAD_EAP_MESSAGE=79
    self.RAD_MESSAGE_AUTHENTIC=80
    self.RAD_ACCT_INTERIM_INTERVAL=85
    self.RAD_NAS_IPV6_ADDRESS=95
    self.RAD_FRAMED_INTERFACE_ID=96
    self.RAD_FRAMED_IPV6_PREFIX=97
    self.RAD_LOGIN_IPV6_HOST=98
    self.RAD_FRAMED_IPV6_ROUTE=99
    self.RAD_FRAMED_IPV6_POOL=100
    self.RAD_ACCT_STATUS_TYPE=40
    self.RAD_START=1
    self.RAD_STOP=2
    self.RAD_UPDATE=3
    self.RAD_ACCOUNTING_ON=7
    self.RAD_ACCOUNTING_OFF=8
    self.RAD_ACCT_DELAY_TIME=41
    self.RAD_ACCT_INPUT_OCTETS=42
    self.RAD_ACCT_OUTPUT_OCTETS=43
    self.RAD_ACCT_SESSION_ID=44
    self.RAD_ACCT_AUTHENTIC=45
    self.RAD_AUTH_RADIUS=1
    self.RAD_AUTH_LOCAL=2
    self.RAD_AUTH_REMOTE=3
    self.RAD_ACCT_SESSION_TIME=46
    self.RAD_ACCT_INPUT_PACKETS=47
    self.RAD_ACCT_OUTPUT_PACKETS=48
    self.RAD_ACCT_TERMINATE_CAUSE=49
    self.RAD_TERM_USER_REQUEST=1
    self.RAD_TERM_LOST_CARRIER=2
    self.RAD_TERM_LOST_SERVICE=3
    self.RAD_TERM_IDLE_TIMEOUT=4
    self.RAD_TERM_SESSION_TIMEOUT=5
    self.RAD_TERM_ADMIN_RESET=6
    self.RAD_TERM_ADMIN_REBOOT=7
    self.RAD_TERM_PORT_ERROR=8
    self.RAD_TERM_NAS_ERROR=9
    self.RAD_TERM_NAS_REQUEST=10
    self.RAD_TERM_NAS_REBOOT=11
    self.RAD_TERM_PORT_UNNEEDED=12
    self.RAD_TERM_PORT_PREEMPTED=13
    self.RAD_TERM_PORT_SUSPENDED=14
    self.RAD_TERM_SERVICE_UNAVAILABLE=15
    self.RAD_TERM_CALLBACK=16
    self.RAD_TERM_USER_ERROR=17
    self.RAD_TERM_HOST_REQUEST=18
    self.RAD_ACCT_MULTI_SESSION_ID=50
    self.RAD_ACCT_LINK_COUNT=51
    self.RAD_ERROR_CAUSE=101
}


exports.Connection = RADConnection;