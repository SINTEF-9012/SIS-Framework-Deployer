var ws_client = function () {
    var that = {};
    that.socket = {};
    that.ready = false;

    that.connect = function (host) {
        if (that.socket != null) {
            if (that.socket.readyState != 1) {
                that.socket = new WebSocket(host);
            } else {
                if (socket.url.indexOf(host) != -1) {
                    alertMessage("error", "Already connected to this  server", 3000);
                } else {
                    // we are using a different input URL
                    that.socket = new WebSocket(host);
                }
            }

        } else {
            that.socket = new WebSocket(host);
        }


        that.socket.onopen = function () {
            alertMessage("success", "Connected to the server", 3000);
            that.ready = true;
        };

        that.socket.onclose = function () {
            that.ready = false;
            console.log('Connection closed: ' + that.socket.readyState);
        };

        that.socket.onmessage = function (msg) {};
    };

    that.send = function (text) {
        try {
            if (!that.ready) {
                setTimeout(function () {
                    that.send(text)
                }, 1000);
            } else {
                that.socket.send(text);
            }
        } catch (exception) {
            console.log("error", 'Unable to send message: ' + exception);
        }
    };

    return that;
};