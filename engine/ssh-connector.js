var SSH = require('simple-ssh');
var fs = require('fs');
var emitter = require('events').EventEmitter;

var ssh_connector = function () {

    var that = new emitter();


    that.initialize = function (ip, port, key) {
        fs.readFile(key, 'utf8', function (err, data) {
            if (err) {
                return console.log("::" + err);
            }
            console.log("Create ssh");
            that.ssh = new SSH({
                host: ip,
                port: port,
                key: data
            });
            that.emit("initialized");
        });
    };


    that.executeCommand = function (command) {
        that.ssh.exec(command, {
            exit: function (code) {
                console.log(code);
            }
        }).start();
    };


    return that;
};

module.exports = ssh_connector;