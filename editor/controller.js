//*****************************************************
// Open and manage the contextual menu
//*****************************************************

var context_menu = (function () {
    var target_node, elem;

    cy.on('cxttap', 'node', function (evt) {
        target_node = evt.target;
        elem = dm.find_node_named(target_node.id());

        //Generate the content of the modal
        $('#form_ctx_modal').html(''); //We clean before we load the content of the modal
        $('#form_ctx_modal').append('<p><b>Properties of "' + target_node.id() + '":</b></p>'); //The header
        build_form(elem, 'form_ctx_modal');

        $("#myModal").modal(); // display modal
    });

    $('#ctx_delete').on('click', function (evt) {
        cy.remove(target_node); //remove from the display
        dm.remove_component(elem); //remove from the model
    });

    $('#ctx_save').on('click', function (evt) {
        //It should laways be a name
        //First we update the display (in the graph and its style to update the label display)
        target_node.id($('#ctx_name').val());
        cy.$('#' + target_node.id()).css({
            content: $('#ctx_name').val()
        });

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

var create_modal = (function () {
    var f, elem, type;

    var manage_modal = function (stype) {
        $('#create_form').html(''); //We clean before we load the content of the modal
        f = node_factory(); // Just to generate the form ...
        type = stype;
        elem = f.create_component(type, {});
        build_form(elem, 'create_form');

        $("#modalDocker").modal();
    }


    $('#vm').on('click', function (e) { //ugly, needs to be exensible
        manage_modal("vm_host");
    });

    $('#docker').on('click', function (e) { //ugly, needs to be exensible
        manage_modal("docker_host");
    });

    $('#nr').on('click', function (e) {
        manage_modal("node_red");
    });

    $('#external_comp').on('click', function (e) {
        manage_modal("external_node");
    });

    $('#device').on('click', function (e) {
        manage_modal("device");
    });

    $('#software').on('click', function (e) {
        manage_modal("software");
    });

    $('#addHost').on('click', function (evt) {
        var fac = graph_factory();
        var node = fac.create_node(type);
        cy.add(node);
        save_form(elem);
        dm.add_component(elem);
    });
}());


function build_form(elem, container) {
    var props = elem.get_all_properties();

    for (var p in props) { // We generate the form from the component's properties
        var item_value = props[p];
        $('#' + container).append('<div class="input-group"> <span class="input-group-addon">' + item_value + '</span><input type="text" id="ctx_' + item_value + '" class="form-control" placeholder="' + item_value + '"></div><br/>');
        if (typeof elem[item_value] === 'object') {
            $('#ctx_' + item_value).val(JSON.stringify(elem[item_value]));
        } else {
            $('#ctx_' + item_value).val(elem[item_value]);
        }
    }
}

function save_form(elem) {
    var props = elem.get_all_properties();
    for (var p in props) {
        var item_value = props[p];
        if (typeof elem[item_value] === 'object') {
            var val = $('#ctx_' + item_value).val();
            elem[item_value] = JSON.parse(val);
        } else {
            elem[item_value] = $('#ctx_' + item_value).val();
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
        if (dm.components[n].hasOwnProperty('id_host') || dm.components[n]._type === 'external_node') { //cannot be an host
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
    if ($('#isController').is(':checked')) {
        edge.classes = 'control';
    }

    cy.add(edge);

    //add to model
    var l = link({});
    l.name = name;
    l.src = selectedSrc;
    l.target = selectedTarget;
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

    function receivedText() {
        var data = JSON.parse(fr.result);
        dm = deployment_model(data.dm);
        dm.revive_components(data.dm.components);
        dm.revive_links(data.dm.links)
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
/*Welcome                              */
/***************************************/
$(document).ready(function () {
    $('#welcomeModal').modal();
});