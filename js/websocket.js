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
                    switch (json.status) {
                    case "running":
                        alertMessage("success", "Node: " + node.id() + " Started", 3000);
                        cy.$('#' + node.id()).css({
                            'border-width': 1,
                            'border-color': '#4A4'
                        });
                        break;
                    case "config":
                        alertMessage("success", node.id() + " is being configured", 3000);
                        cy.$('#' + node.id()).css({
                            'border-width': 1,
                            'border-color': 'orange'
                        });
                        break;
                    case "error":
                        alertMessage("error", "Could not start" + node.id(), 3000);
                        cy.$('#' + node.id()).css({
                            'border-width': 1,
                            'border-color': '#A33'
                        });
                        break;
                    case "OK": //It is a link
                        alertMessage("success", "Link configured!", 3000);
                        cy.$('#' + node.id()).css({
                            'background-color': '#4A4',
                            'line-color': '#4A4',
                            'target-arrow-color': '#4A4',
                            'source-arrow-color': '#4A4'
                        });
                        break;
                    case "OK": //It is a link   
                        cy.$('#' + node.id()).css({
                            'background-color': 'orange',
                            'line-color': 'orange',
                            'target-arrow-color': 'orange',
                            'source-arrow-color': 'orange'
                        });
                        break;
                    }
                } else {
                    var json_tmp = [];
                    if (msg[0] === "@") { //This is an update on the types
                        json_tmp = JSON.parse(msg.substr(1, msg.length));
                        for (var j = 0; j < json_tmp.length; j++) {
                            var name = json_tmp[j].id.replace('.js', '');
                            if (json_tmp[j].isExternal) {
                                $('#dynamic_menu_ext').append('<li><a href="#" class="generated" id="' + name + '">' + name + '</a></li>'); //software components
                            } else {
                                $('#dynamic_menu').append('<li><a href="#" class="generated" id="' + name + '">' + name + '</a></li>'); //software components   
                            }
                        }
                    }

                    create_modal(json_tmp);
                }

            }
        };
    };

    /*that.createScriptTags = function (array) {
        let tmp_array = array
        let script = tmp_array.shift();
        if (!script) {
            console.log("All scripts are loaded");
            return;
        }
        var name = script.id.replace('.js', '');
        $('#dynamic_menu').append('<li><a href="#" id="' + name + '">' + name + '</a></li>')
        var scr = document.createElement("script"); //Load the plugins
        scr.type = 'text/javascript';
        scr.onload = (event) => {
            // loads the next script
            that.createScriptTags(tmp_array);
        };
        scr.src = "repository/" + script.id;
        document.body.appendChild(scr);
    };*/

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