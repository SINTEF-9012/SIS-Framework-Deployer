//*****************************************************
// Open and manage the contextual menu
//*****************************************************

var context_menu = (function () {
    var target_node, elem, target_link;

    cy.on('cxttap', 'node', function (evt) {
        target_node = evt.target;
        elem = dm.find_node_named(target_node.id());

        //Generate the content of the modal
        $('#form_ctx_modal').html(''); //We clean before we load the content of the modal
        $('#form_ctx_modal').append('<p><b>Properties of "' + target_node.id() + '":</b></p>'); //The header
        build_form(elem, 'form_ctx_modal');

        $("#myModal").modal(); // display modal
    });

    cy.on('cxttap', 'edge', function (evt) {
        target_link = evt.target;
        elem = dm.find_link_named(target_link.id());

        //Generate the content of the modal
        $('#form_ctx_modal').html(''); //We clean before we load the content of the modal
        $('#form_ctx_modal').append('<p><b>Properties of "' + target_link.id() + '":</b></p>'); //The header
        build_form(elem, 'form_ctx_modal');

        $("#myModal").modal(); // display modal
    });

    $('#ctx_delete').on('click', function (evt) {
        if (target_node) {
            cy.remove(target_node); //remove from the display
            dm.remove_component(elem); //remove from the model

        } else {
            cy.remove(target_link); //remove from the display
            dm.remove_link(elem); //remove from the model
        }
    });

    $('#ctx_save').on('click', function (evt) {
        //It should always be a name
        //First we update the display (in the graph and its style to update the label display)
        if (target_node) {
            target_node.id($('#ctx_name').val());
            cy.$('#' + target_node.id()).css({
                content: $('#ctx_name').val()
            });
        } else {
            if (!target_link.isControl) {
                cy.$('#' + target_link.id()).removeClass('control');
            }
        }

        //then the node in the model
        save_form(elem);
    });

    $('#ctx_goto').on('click', function (evt) {
        var port = $('#ctx_port').val();
        var host_id = $('#ctx_id_host').val();
        var h = dm.find_node_named(host_id);
        var win = window.open('http://' + h.ip + ':' + port, '_blank');
        win.focus();
    });

}());



/***************************************/
/*Manage the creation modal and its    */
/*content                              */
/***************************************/

var create_modal = function (modules) {
    var f, elem, type;

    var manage_modal = function (stype, isPlugin) {
        $('#create_form').html(''); //We clean before we load the content of the modal
        f = dm.node_factory(); // Just to generate the form ...
        type = stype;
        if (!isPlugin) {
            elem = f.create_component(type, {});
        } else {
            for (var j = 0; j < modules.length; j++) {
                if (modules[j].id === stype) {
                    var tmp = JSON.stringify(modules[j].module);
                    elem = JSON.parse(tmp);
                    break;
                }
            }
        }
        build_form(elem, 'create_form');

        $("#modalDocker").modal();
    }


    $('#vm').on('click', function (e) { //ugly, needs to be exensible
        manage_modal("vm_host", false);
    });

    $('#docker').on('click', function (e) { //ugly, needs to be exensible
        manage_modal("docker_host", false);
    });

    $('#external_comp').on('click', function (e) {
        manage_modal("external_node", false);
    });

    $('#device').on('click', function (e) {
        manage_modal("device", false);
    });

    $('#node_red').on('click', function (e) {
        manage_modal("node_red", false);
    });

    $('#software').on('click', function (e) {
        manage_modal("software", false);
    });

    $('.generated').on('click', function (e) {
        manage_modal(event.target.id, true);
    });

    $('#addHost').on('click', function (evt) { //When you click on add in the modal
        var fac = graph_factory();
        var node = fac.create_node(type);
        cy.add(node);
        save_form(elem);
        dm.add_component(elem);
    });
};

function get_all_properties(elem) {
    var props = [];
    for (var prop in elem) {
        if (typeof elem[prop] != 'function') {
            props.push(prop);
        }
    }
    return props;
}


function build_form(elem, container) {
    var props = get_all_properties(elem);

    for (var p in props) { // We generate the form from the component's properties
        var item_value = props[p];

        if (typeof elem[item_value] === 'boolean') {
            $('#' + container).append('<div class="input-group"> ' + item_value + ' <input id="ctx_' + item_value + '" type="checkbox" class="form-check-input"></div><br/>');
            $('#ctx_' + item_value).prop('checked', elem[item_value]);
        } else {
            $('#' + container).append('<div class="input-group"> <span class="input-group-addon">' + item_value + '</span><input type="text" id="ctx_' + item_value + '" class="form-control" placeholder="' + item_value + '"></div><br/>');
            if (typeof elem[item_value] === 'object') {
                $('#ctx_' + item_value).val(JSON.stringify(elem[item_value]));
            } else {
                $('#ctx_' + item_value).val(elem[item_value]);
            }
        }

    }
}

function save_form(elem) {
    var props = get_all_properties(elem);
    for (var p in props) {
        var item_value = props[p];

        if (typeof elem[item_value] === 'boolean') {
            elem[item_value] = $('#ctx_' + item_value).is(':checked');
        } else {
            if (typeof elem[item_value] === 'object') {
                var val = $('#ctx_' + item_value).val();
                elem[item_value] = JSON.parse(val);
            } else {
                elem[item_value] = $('#ctx_' + item_value).val();
            }
        }
    }
    alertMessage("success", "Modification saved!", 2000);
}

/***************************************/
/*Manage links and containments        */
/***************************************/

$('#modalLink').on('show.bs.modal', function () {
    $('#selSrc').html(''); //we clean first
    $('#selTarget').html('');
    for (n in dm.components) {
        if (!dm.components[n].hasOwnProperty('ip')) { //cannot be an host
            $('#selSrc').append('<option>' + dm.components[n].name + '</option>');
            $('#selTarget').append('<option>' + dm.components[n].name + '</option>');
        }
    }
});

$('#modalContainment').on('show.bs.modal', function () {
    $('#selComp').html(''); //we clean first
    $('#selHost').html('');
    for (n in dm.components) {
        if (dm.components[n].hasOwnProperty('id_host')) { //a component
            $('#selComp').append('<option>' + dm.components[n].name + '</option>');
        } else { //a host
            $('#selHost').append('<option>' + dm.components[n].name + '</option>');
        }
    }
});


$('#addLink').on('click', function (evt) {
    var name = $('#linkName').val();
    var selectedSrc = $('#selSrc').val();
    var selectedTarget = $('#selTarget').val();

    //add to graph
    var edge = {
        group: "edges",
        data: {
            id: name,
            source: selectedSrc,
            target: selectedTarget
        }
    };

    var l = link({});
    l.name = name;
    l.src = selectedSrc;
    l.target = selectedTarget;
    if ($('#isController').is(':checked')) {
        edge.classes = 'control';
        l.isControl = true;
    } else {
        l.isControl = false;
    }

    cy.add(edge);

    //add to model
    dm.links.push(l);
});

$('#addContainment').on('click', function (evt) {
    var selectedSrc = $('#selComp').val();
    var selectedTarget = $('#selHost').val();

    //update graph
    var node = cy.getElementById(selectedSrc);
    node.move({
        parent: selectedTarget
    });

    //update model
    var comp = dm.find_node_named(selectedSrc);
    comp.id_host = selectedTarget;
});


/***************************************/
/*Deploy                               */
/***************************************/
var client = ws_client();

$('#removeAll').on('click', function (evt) {
    cy.elements().remove();
    var model = "{}";
    client.send(model);
    alertMessage("success", "Model sent!", 3000);
});

$('#deployAll').on('click', function (evt) {
    var model = JSON.stringify(dm);
    client.send(model);
    alertMessage("success", "Model sent!", 3000);
});


$('#go').on('click', function () {
    console.log($('#url').val());
    client.connect($('#url').val());
});


/***************************************/
/*Load and save                        */
/***************************************/


$('#loadFile').on('click', function (evt) {
    var input, file, fr;
    var input = $('#selectedFile').get(0);
    if (!input) {
        console.log("error", "Hum, couldn't find the selectedFile element.", 5000);
    } else if (!input.files) {
        console.log("error", "This browser doesn't seem to support the `files` property of file inputs", 5000);
    } else if (!input.files[0]) {
        console.log("error", "Please select a file before clicking 'Load'", 5000);
    }
    //its ok
    else {
        file = input.files[0];
        fr = new FileReader();
        fr.onload = receivedText;
        fr.readAsText(file);
    }

    function receivedText() { //We ask the server because he is the one with all the plugins ...
        var data = JSON.parse(fr.result);
        dm = deployment_model(data.dm);
        dm.components = data.dm.components;
        dm.revive_links(data.dm.links);
        cy.json(data.graph);
    }

});

$('#save').on('click', function (evt) {
    var all_in_one = {
        dm: dm,
        graph: cy.json()
    };
    window.open("data:application/octet-stream," + JSON.stringify(all_in_one));
});


/***************************************/
/*Welcome                              */
/***************************************/
$(document).ready(function () {
    $('#welcomeModal').modal();
});