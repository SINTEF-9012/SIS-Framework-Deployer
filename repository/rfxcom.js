var mm = require('../metamodel/allinone.js');

/******************************/
/* rfxcom component           */
/******************************/
var rfxcom = function (spec) {
    var that = mm.external_node(spec); //the inheritance
    that._type = "rfxcom";
    that.nr_description = {
        package: "node-red-contrib-rfxcom",
        node: [{
            "id": "20d1732e.942b84",
            "type": "rfx-sensor",
            "z": "36abed84.04bdb2",
            "name": "",
            "port": "b60198b5.e6fb28",
            "topicSource": "all",
            "topic": "",
            "x": 282.5,
            "y": 363,
            "wires": [[]]
        }, {
            "id": "b60198b5.e6fb28",
            "type": "rfxtrx-port",
            "z": "",
            "port": "/dev/ttyUSB0",
            "rfyVenetianMode": "EU"
        }]
    };

    return that;
};

module.exports = rfxcom;