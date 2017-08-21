var Docker = require('dockerode');
var bus = require('./event-bus.js');

var docker_connector = function () {
    var that = {};
    that.docker = {};

    that.buildAndDeploy = function (endpoint, port, port_bindings, devices, command, image) {
        that.docker = new Docker({
            host: endpoint,
            port: port
        });
        that.docker.pull(image, function (err, stream) {
            if (stream !== null) {
                stream.pipe(process.stdout, {
                    end: true
                });
                stream.on('end', function () {
                    that.createContainerAndStart(port_bindings, command, image, devices);
                });
            } else {
                that.createContainerAndStart(port_bindings, command, image, devices);
            }
        });
    }

    that.createContainerAndStart = function (port_bindings, command, image, devices) {
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

        console.log('Port: ' + port);
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

        that.docker.createContainer(options).then(function (container) {
            //return container.start();
            container.start(function () {
                bus.emit('container-started');
            });
        }).catch(function (err) {
            console.log(err);
        });


    }
    return that;
};

module.exports = docker_connector;