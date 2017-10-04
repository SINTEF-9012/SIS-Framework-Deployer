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

    that.remove_containers = function (diff, dm) {
        var removed = diff.list_of_removed_components;
        var connector = dc();
        for (var i in removed) {
            var host_id = removed[i].id_host;
            var host = dm.find_node_named(host_id); //This cannot be done!
            if (host === undefined) {
                //Need to find the host in the old model
                var rem_hosts = diff.list_removed_hosts;
                var tab = rem_hosts.filter(function (elem) {
                    if (elem.name === host_id) {
                        return elem;
                    }
                });
                if (tab.length > 0) {
                    connector.stopAndRemove(removed[i].container_id, tab[0].ip, tab[0].port);
                }
            } else {
                connector.stopAndRemove(removed[i].container_id, host.ip, host.port);
            }
        }
    };


    //To be refactored
    bus.on('container-error', function (comp_name) {
        //Send status info to the UI
        var s = {
            node: comp_name,
            status: 'error'
        };
        that.socketObject.send("#" + JSON.stringify(s));
    });

    bus.on('container-config', function (comp_name) {
        //basically, host is accessible
        var host_id = that.dep_model.find_node_named(comp_name).id_host;
        var h = {
            node: host_id,
            status: 'running'
        };
        that.socketObject.send("#" + JSON.stringify(h));

        //Send status info to the UI
        var s = {
            node: comp_name,
            status: 'config'
        };
        that.socketObject.send("#" + JSON.stringify(s));
    });

    bus.on('link-ok', function (link_name) {
        var s = {
            node: link_name,
            status: 'OK'
        };
        that.socketObject.send("#" + JSON.stringify(s));
    });

    bus.on('link-ko', function (link_name) {
        var s = {
            node: link_name,
            status: 'KO'
        };
        that.socketObject.send("#" + JSON.stringify(s));
    });

    that.run = function (dm) { //TODO: factorize
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


            //Send status info to the UI
            var s = {
                node: comp_name,
                status: 'running'
            };
            that.socketObject.send("#" + JSON.stringify(s));

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

                        sendGet(host.ip, comp_tab[i].port, src_tab, tgt_tab, dm, generate_components);

                    }
                }
            }
        });
    };


    that.start = function () {
        that.webSocketServerObject.on('connection', function (socketObject) {
            that.socketObject = socketObject;

            socketObject.on('message', function (message) {

                //Load the model
                var data = JSON.parse(message);
                var dm = mm.deployment_model(data);
                dm.revive_components(data.components);
                dm.revive_links(data.links);


                if (that.dep_model === 'undefined') {
                    that.dep_model = dm;
                    //Deploy: keep it because I know it works :p
                    //TODO: remove this
                    that.run(that.dep_model);
                } else {
                    //Compare model
                    var comparator = comp(that.dep_model);
                    that.diff = comparator.compare(dm);
                    that.dep_model = dm; //target model becomes current


                    //First do all the removal stuff
                    console.log("Stopping removed containers");
                    that.remove_containers(that.diff, that.dep_model);

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



//TODO: to be factorised with the run function. This class should be heavily refactored
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

    bus.on('container-started', function (container_id, comp_name) {
        tmp++;
        console.log(tmp + ' :: ' + nb);
        //Add container id to the component
        var comp = dm.find_node_named(comp_name);
        comp.container_id = container_id;


        //Send status info to the UI
        var s = {
            node: comp_name,
            status: 'running'
        };
        that.socketObject.send("#" + JSON.stringify(s));

        if (tmp >= nb) {
            tmp = 0;

            var comp_tab = dm.get_all_hosted();

            //For all hosted components we generate the websocket proxies
            for (var i in comp_tab) {
                var host_id = comp_tab[i].id_host;
                var host = dm.find_node_named(host_id);
            }

            //Get all links that start from the component
            var src_tab = dm.get_all_outputs_of_component(comp_tab[i]).filter(function (elem) {
                if (diff.list_of_added_links.includes(elem)) {
                    return elem;
                }
            });
            //Get all links that end in the component
            var tgt_tab = dm.get_all_inputs_of_component(comp_tab[i]).filter(function (elem) {
                if (diff.list_of_added_links.includes(elem)) {
                    return elem;
                }
            });

            if ((src_tab.length > 0) || (tgt_tab.length > 0)) {

                sendGet(host.ip, comp_tab[i].port, src_tab, tgt_tab, dm, generate_components);

            }

        }

    });

    return nb;
}

//This part has to be heavily refactored... Too late for this right now...
function generate_components(ip_host, tgt_port, src_tab, tgt_tab, dm, old_components) {
    //We keep the old elements without the generated ones
    var filtered_old_components = old_components.filter(function (elem) {
        if (elem.name !== undefined) {
            if (!elem.name.startsWith("to_") && !elem.name.startsWith("from_")) {
                return elem;
            }
        }
    });


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

    //We concat the old flow with the new one
    var t = JSON.parse(flow);
    var result = filtered_old_components.concat(t)


    sendPost(ip_host, tgt_port, JSON.stringify(result), tgt_tab);
}

function sendGet(tgt_host, tgt_port, src_tab, tgt_tab, dm, callback) {
    var opt = {
        host: tgt_host,
        path: '/flows', //The Flows API of nodered, which set the active flow configuration
        port: tgt_port
    };
    http.get(opt, function (resp) {
        resp.on('data', function (chunk) {
            callback(tgt_host, tgt_port, src_tab, tgt_tab, dm, JSON.parse(chunk));
        });
    }).on("error", function (e) {
        console.log("Got error: " + e.message);
        setTimeout(function () { //Should only test n times
            sendGet(tgt_host, tgt_port, src_tab, tgt_tab, dm, callback);
        }, 2000);
    });
}

function sendPost(tgt_host, tgt_port, data, tgt_tab) {
    var options = {
        host: tgt_host,
        path: '/flows', //The Flows API of nodered, which set the active flow configuration
        port: tgt_port,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Node-RED-Deployment-Type': 'flows' //only flows that contain modified nodes are stopped before the new configuration is applied.
        }
    };

    var req = http.request(options, function (response) {
        var str = ''
        response.on('data', function (chunk) {
            str += chunk;
        });

        response.on('end', function () {
            console.log("Request completed " + str);
            for (var w in tgt_tab) { //if success, send feedback
                bus.emit('link-ok', tgt_tab[w].name);
            }
        });

    });

    req.on('error', function (err) {
        console.log("Connection to " + tgt_host + " not yet open");
        setTimeout(function () {
            for (var w in tgt_tab) {
                bus.emit('link-ko', tgt_tab[w].name);
            }
            sendPost(tgt_host, tgt_port, data, tgt_tab); //we try to reconnect if the connection as failed
        }, 5000);
    });



    //This is the data we are posting, it needs to be a string or a buffer
    req.write(data);
    req.end();
}

module.exports = engine;