//First we create a deployment model, not sure this should be here ...
var dm = deployment_model({
    name: 'demo'
});


var cy = window.cy = cytoscape({
    container: document.getElementById('cy'),

    boxSelectionEnabled: false,
    autounselectify: true,

    style: [
        {
            selector: 'node',
            css: {
                'content': 'data(id)',
                'background-fit': 'contain',
                'background-image-opacity': '0.3',
                'text-valign': 'center',
                'text-halign': 'center',
                'font-size': '4px',
                'font-weight': 'bold'
            }
    },
        {
            selector: 'node.container',
            css: {
                'padding-top': '10px',
                'padding-left': '10px',
                'padding-bottom': '10px',
                'padding-right': '10px',
                'text-valign': 'top',
                'text-halign': 'center',
                'background-color': '#DDD',
                'font-size': '8px',
                'font-weight': 'normal',
                'shape': 'rectangle'
            }
    },
        {
            selector: 'edge',
            css: {
                'curve-style': 'bezier',
                'target-arrow-shape': 'triangle'
            }
    },
        {
            selector: ':selected',
            css: {
                'background-color': 'black',
                'line-color': 'black',
                'target-arrow-color': 'black',
                'source-arrow-color': 'black'
            }
    }, {
            selector: 'node.questionable',
            css: {
                'border-color': '#A33',
                'background-color': '#B55',
                'shape': 'roundrectangle'
            }
    }, {
            selector: 'node.node_red',
            css: {
                'background-image': './img/node-red-256.png',
            }
    }
    ],

    elements: {
        nodes: [],
        edges: []
    },

    layout: {
        name: 'preset',
        padding: 5
    }

});

var graph_factory = function () {
    var name = $("#ctx_name").val();

    var node = { // Add to the display
        group: "nodes", //we need a factory for this.
        data: {
            id: name
        },
        position: {
            x: 100,
            y: 100
        }
    };

    this.create_node = function (type) {
        if (type === "external_host") {
            node.classes = 'container';
        } else if (type === "vm_host") {
            node.classes = 'container';
        } else if (type === "docker_host") {
            node.classes = 'container';
        } else if (type === "external_node") {

        } else if (type === "node_red") {
            node.classes = 'node_red';
        } else if (type === "controller") {
            node.classes = 'questionable';
        }
        return node;
    }

    return this;
};