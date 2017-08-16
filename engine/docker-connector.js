var Docker = require('dockerode');

var docker_connector = function () {
    var that = {};
    that.docker = {};

    that.buildAndDeploy = function (endpoint, port, exposed_port, port_bindings, command, image) {
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
                    that.createContainerAndStart(exposed_port, port_bindings, command, image);
                });
            } else {
                that.createContainerAndStart(exposed_port, port_bindings, command, image);
            }
        });
    }

    that.createContainerAndStart = function (exposed_port, port_bindings, command, image) {
        //Create a container from an image
        //This is crappy code :)
        var port = '{';
        for (var i in port_bindings) {
            var item_value = port_bindings[i];
            port += '"' + item_value + '/tcp" : [{ "HostIP":"0.0.0.0", "HostPort": "' + i + '" }],';
        }
        port = port.slice(0, -1);
        port += '}';

        var exposedPort = '{"' + exposed_port + '/tcp": {}}';

        var options = {
            Image: image,
            AttachStdin: false,
            AttachStdout: true,
            AttachStderr: true,
            Tty: true,
            Cmd: ['/bin/bash', '-c', command],
            OpenStdin: false,
            StdinOnce: false
        };
        console.log('Port: ' + port);
        options.ExposedPorts = JSON.parse(exposedPort);
        options.HostConfig = {}; //This has to be updated when several containers
        options.HostConfig.PortBindings = JSON.parse(port);

        that.docker.createContainer(options).then(function (container) {
            return container.start();
        }).catch(function (err) {
            console.log(err);
        });


    }
    return that;
};

module.exports = docker_connector;