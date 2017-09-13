var Docker = require('dockerode');
var bus = require('./event-bus.js');

var docker_connector = function () {
    var that = {};
    that.docker = {};
    that.comp_name = '';

    that.stopAndRemove = function (container_id, endpoint, port) {
        that.docker = new Docker({ //TODO:Refactor
            host: endpoint,
            port: port
        });
        that.docker.getContainer(container_id).stop(function (done) {
            that.docker.getContainer(container_id).remove(function (removed) {
                bus.emit('removed', container_id);
            });
        });
    };

    that.buildAndDeploy = function (endpoint, port, port_bindings, devices, command, image, mounts, compo_name) {
        that.docker = new Docker({
            host: endpoint,
            port: port
        });
        that.comp_name = compo_name;
        that.docker.pull(image, function (err, stream) {
            bus.emit('container-config', compo_name);
            if (stream !== null) {
                stream.pipe(process.stdout, {
                    end: true
                });
                stream.on('end', function () {
                    that.createContainerAndStart(port_bindings, command, image, devices, mounts);
                });
            } else {
                that.createContainerAndStart(port_bindings, command, image, devices, mounts);
            }
        });
    }

    that.createContainerAndStart = function (port_bindings, command, image, devices, mounts) {
        //Create a container from an image
        //This is crappy code :)
        var port = '{';
        var exposedPort = '{';
        for (var i in port_bindings) {
            var item_value = port_bindings[i];
            port += '"' + item_value + '/tcp" : [{ "HostIP":"0.0.0.0", "HostPort": "' + i + '" }],';
            exposedPort += '"' + item_value + '/tcp": {},';
        }
        port = port.slice(0, -1);
        port += '}';
        exposedPort = exposedPort.slice(0, -1);
        exposedPort += '}';

        var options = {
            Image: image,
            AttachStdin: false,
            AttachStdout: true,
            AttachStderr: true,
            Tty: true,
            OpenStdin: false,
            StdinOnce: false
        };

        if (command !== "") {
            options.Cmd = ['/bin/bash', '-c', command];
        }

        options.ExposedPorts = JSON.parse(exposedPort);
        options.HostConfig = {};
        options.HostConfig.PortBindings = JSON.parse(port);

        if (devices !== undefined) {
            if (devices.PathOnHost !== '') {
                options.HostConfig.Devices = [{
                    'PathOnHost': devices.PathOnHost,
                    'PathInContainer': devices.PathInContainer,
                    'CgroupPermissions': devices.CgroupPermissions
                }];
            }
        }

        options.Mounts = [];
        if (mounts !== undefined) {
            options.Mounts.push({
                "Name": "",
                "Source": mounts.src,
                "Destination": mounts.tgt,
                "ReadOnly": false,
                "Type": "volume"
            });
        }

        that.docker.createContainer(options).then(function (container) {
            //return container.start();
            container.start(function () {
                bus.emit('container-started', container.id, that.comp_name);
            });
        }).catch(function (err) {
            bus.emit('container-error', that.comp_name);
            console.log(err);
        });


    }
    return that;
};

module.exports = docker_connector;