var webSocketServer = require('ws').Server;
var http = require('http');
var fs = require('fs');
var mm = require('../metamodel/allinone.js');
var dc = require('./docker-connector.js');

var engine = (function () {
    var that = {};

    that.webSocketServerObject = new webSocketServer({
        port: 9060
    });

    that.socketObject = {};

    that.start = function () {
        that.webSocketServerObject.on('connection', function (socketObject) {
            that.socketObject = socketObject;

            socketObject.on('message', function (message) {
                console.log('The Message Received:' + message);

                //Load the model
                var data = JSON.parse(message);
                var dm = mm.deployment_model(data);
                dm.revive_components(data.components);
                dm.revive_links(data.links);
                console.log("\n" + JSON.stringify(dm) + "\n");
                //Deploy
                run(dm);

            });

            socketObject.on('close', function (c, d) {
                console.log('Disconnect ' + c + ' -- ' + d);
            });
        });
    };

    return that;
}());

function run(dm) {
    var comp = dm.get_all_hosted();
    for (var i in comp) {
        var host_id = comp[i].id_host;
        var host = dm.find_node_named(host_id);
        var connector = dc();
        if (host._type === "docker_host") {
            if (comp[i]._type === "node_red") {
                //then we deploy node red
                //TODO: what if port_bindings is empty?
                connector.buildAndDeploy(host.ip, host.port, comp[i].port, comp[i].docker_resource.port_bindings, "", "nicolasferry/enact-framework"); //
            } else {
                connector.buildAndDeploy(host.ip, host.port, comp[i].port, host.port_bindings, comp[i].docker_resource().command, comp[i].docker_resource().image);
            }
        }
    }
}

module.exports = engine;