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

        that.socket.onmessage = function (e) { //This behavior should not be here...
            var msg = e.data;
            if (msg[0] === "!") { // This is a notification
                alertMessage("info", msg, 3000);
            } else {
                if (msg[0] === "#") { //This is about status, contains status info, and node name
                    var json = JSON.parse(msg.substr(1, msg.length));
                    var node = cy.getElementById(json.node);
                    console.log(node);
                    //status can be running or error
                    if (json.status === "running") {
                        alertMessage("success", "Node: " + node.id() + " Started", 4000);
                        cy.$('#' + node.id()).css({
                            'border-width': 2,
                            'border-color': '#4A4'
                        });
                    } else {
                        alertMessage("error", "Could not start" + node.id(), 4000);
                        cy.$('#' + node.id()).css({
                            'border-width': 2,
                            'border-color': '#A33'
                        });
                    }
                }
            }
        };
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