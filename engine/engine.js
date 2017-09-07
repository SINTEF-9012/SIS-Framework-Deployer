var webSocketServer = require('ws').Server;
var http = require('http');
var fs = require('fs');
var mm = require('../metamodel/allinone.js');
var dc = require('./docker-connector.js');
var bus = require('./event-bus.js');
var uuidv1 = require('uuid/v1');
var comp = require('./model-comparison.js')


var engine = (function () {
    var that = {};
    that.dep_model = 'undefined';
    that.diff = {};

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


                if (that.dep_model === 'undefined') {
                    that.dep_model = dm;
                    //Deploy: keep it because I know it works :p
                    run(that.dep_model);
                } else {
                    //Compare model
                    var comparator = comp(that.dep_model);
                    that.diff = comparator.compare(dm);
                    that.dep_model = dm;


                    //First do all the removal stuff
                    console.log("Stopping removed containers");
                    removal(that.diff, that.dep_model);

                    //Deploy only the added stuff
                    console.log("Starting new containers");
                    deploy(that.diff, that.dep_model);

                }

            });

            socketObject.on('close', function (c, d) {
                console.log('Disconnect ' + c + ' -- ' + d);
            });
        });
    };

    return that;
}());

function removal(diff, dm) {
    var removed = diff.list_of_removed_components;
    console.log('removal =>' + JSON.stringify(removed));
    for (var i in removed) {
        var host_id = removed[i].id_host;
        var host = dm.find_node_named(host_id);
        var connector = dc();
        connector.stopAndRemove(removed[i].container_id, host.ip, host.port);
    }
}


function deploy(diff, dm) {
    var comp = diff.list_of_added_components;
    var nb = 0;

    for (var i in comp) {
        var host_id = comp[i].id_host;
        var host = dm.find_node_named(host_id);
        var connector = dc();
        if (host._type === "docker_host") {
            nb++;
            if (comp[i]._type === "node_red") {
                //then we deploy node red
                //TODO: what if port_bindings is empty?
                connector.buildAndDeploy(host.ip, host.port, comp[i].docker_resource.port_bindings, comp[i].docker_resource.devices, "", "nicolasferry/enact-framework", comp[i].docker_resource.mounts, comp[i].name); //
            } else {
                connector.buildAndDeploy(host.ip, host.port, comp[i].docker_resource.port_bindings, comp[i].docker_resource.devices, comp[i].docker_resource.command, comp[i].docker_resource.image, comp[i].docker_resource.mounts, comp[i].name);
            }
        }
    }
    return nb;
}

function run(dm) { //TODO: factorize
    var comp = dm.get_all_hosted();
    var nb = 0;
    var tmp = 0;

    for (var i in comp) {
        var host_id = comp[i].id_host;
        var host = dm.find_node_named(host_id);
        var connector = dc();
        if (host._type === "docker_host") {
            nb++;
            if (comp[i]._type === "node_red") {
                //then we deploy node red
                //TODO: what if port_bindings is empty?
                connector.buildAndDeploy(host.ip, host.port, comp[i].docker_resource.port_bindings, comp[i].docker_resource.devices, "", "nicolasferry/enact-framework", comp[i].docker_resource.mounts, comp[i].name); //
            } else {
                connector.buildAndDeploy(host.ip, host.port, comp[i].docker_resource.port_bindings, comp[i].docker_resource.devices, comp[i].docker_resource.command, comp[i].docker_resource.image, comp[i].docker_resource.mounts, comp[i].name);
            }
        }
    }

    //We collect all the started events, once they are all received we generate the flow skeleton based on the links
    bus.on('container-started', function (container_id, comp_name) {
        tmp++;
        console.log(tmp + ' :: ' + nb);
        //Add container id to the component
        var comp = dm.find_node_named(comp_name);
        comp.container_id = container_id;

        if (tmp >= nb) {
            tmp = 0;
            var comp_tab = dm.get_all_hosted();

            //For all hosted components we generate the websocket proxies
            for (var i in comp_tab) {
                var host_id = comp_tab[i].id_host;
                var host = dm.find_node_named(host_id);

                //Get all links that start from the component
                var src_tab = dm.get_all_outputs_of_component(comp_tab[i]);
                //Get all links that end in the component
                var tgt_tab = dm.get_all_inputs_of_component(comp_tab[i]);

                if ((src_tab.length > 0) || (tgt_tab.length > 0)) {

                    var flow = '[';

                    //For each link starting from the component we add a websocket out component
                    for (var j in src_tab) {
                        var tgt_component = dm.find_node_named(src_tab[j].target);
                        var source_component = dm.find_node_named(src_tab[j].src);
                        var tgt_host_id = tgt_component.id_host;
                        var tgt_host = dm.find_node_named(tgt_host_id);
                        var client = uuidv1();
                        flow += '{"id":"' + uuidv1() + '","type":"websocket out","z":"a880eeca.44e59","name":"to_' + tgt_component.name + '","server":"","client":"' + client + '","x":331.5,"y":237,"wires":[]},{"id":"' + client + '","type":"websocket-client","z":"","path":"ws://' + tgt_host.ip + ':' + tgt_component.port + '/ws/' + source_component.name + '","wholemsg":"false"},';
                    }

                    //For each link ending in the component we add a websocket in component
                    for (var z in tgt_tab) {
                        var server = uuidv1();
                        var src_component = dm.find_node_named(tgt_tab[z].src);
                        flow += '{"id":"' + uuidv1() + '","type":"websocket in","z":"75e4ddec.107b74","name":"from_' + src_component.name + '","server":"' + server + '","client":"","x":143.5,"y":99,"wires":[]},{"id":"' + server + '","type":"websocket-listener","z":"","path":"/ws/' + src_component.name + '","wholemsg":"false"},';
                    }

                    //Remove the last ','
                    flow = flow.slice(0, -1);
                    //Close the flow description
                    flow += ']';

                    //Send the request to the component
                    sendPost(host.ip, comp_tab[i].port, flow);
                }
            }
        }
    });
}


function sendPost(tgt_host, tgt_port, data) {
    var options = {
        host: tgt_host,
        path: '/flows', //The Flows API of nodered, which set the active flow configuration
        port: tgt_port,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    var req = http.request(options, function (response) {
        var str = ''
        response.on('data', function (chunk) {
            str += chunk;
        });

        response.on('end', function () {
            console.log(str);
        });


    });

    req.on('error', function (err) {
        console.log("Connection to " + tgt_host + " not yet open");
        setTimeout(function () {
            sendPost(tgt_host, tgt_port, data); //we try to reconnect if the connection as failed
        }, 5000);
    });
    //This is the data we are posting, it needs to be a string or a buffer
    req.write(data);
    req.end();
}

module.exports = engine;