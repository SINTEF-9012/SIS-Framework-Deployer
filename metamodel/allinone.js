/*****************************/
/*Deployment model           */
/*Contain all nodes and links*/
/*****************************/

var deployment_model = function (spec) {
    var that = {};
    that.name = spec.name || 'a name';
    that.components = [];
    that.links = [];

    that.add_component = function (component) {
        that.components.push(component);
    };

    that.add_link = function (link) {
        that.links.push(link);
    };

    that.remove_component = function (component) {
        var i = that.components.indexOf(component); // This could be factorized in the array.prototype
        if (i > -1) {
            that.components.splice(i, 1); //The second parameter of splice is the number of elements to remove. Note that splice modifies the array in place and returns a new array containing the elements that have been removed. 
        }
    };

    that.remove_link = function (link) {
        var i = that.links.indexOf(link);
        if (i > -1) {
            that.links.splice(i, 1);
        }
    };

    that.revive_components = function (comps) {
        for (var i in comps) {
            var f = node_factory();
            var node = f.create_component(comps[i]._type, comps[i]);
            that.components.push(node);
        }
    };

    that.revive_links = function (links) {
        for (var i in links) {
            var l = link(links[i]);
            that.links.push(l);
        }
    };

    that.find_node_named = function (name) {
        var tab = that.components.filter(function (elem) {
            if (elem.name === name) {
                return elem;
            }
        });
        if (tab.length > 0) {
            return tab[0];
        }
    };

    that.find_link_named = function (name) {
        var tab = that.links.filter(function (elem) {
            if (elem.name === name) {
                return elem;
            }
        });
        if (tab.length > 0) {
            return tab[0];
        }
    };

    that.get_all_hosts = function () {
        var tab = that.components.filter(function (elem) {
            if (!elem.hasOwnProperty('id_host')) {
                return elem;
            }
        });
        return tab;
    };

    that.get_all_hosted = function () {
        var tab = that.components.filter(function (elem) {
            console.log(elem);
            if (elem.hasOwnProperty('id_host')) {
                return elem;
            }
        });
        return tab;
    };

    that.get_all_inputs_of_component = function (comp) {
        var tab = that.links.filter(function (elem) {
            if (elem.target === comp.name) {
                return elem;
            }
        });
        return tab;
    };

    that.get_all_outputs_of_component = function (comp) {
        var tab = that.links.filter(function (elem) {
            if (elem.src === comp.name) {
                return elem;
            }
        });
        return tab;
    };

    return that;
}

/*****************************/
/*Component                  */
/*****************************/

var component = function (spec) {
    var that = {};

    that.name = spec.name || 'a_component';
    that.properties = [];

    that.id = spec.id || 'a_unique_id';

    that.add_property = function (prop) {
        that.properties.push(prop);
    };

    that.remove_property = function (prop) {
        var i = that.properties.indexOf(prop);
        if (i > -1) {
            that.properties.splice(i, 1); //The second parameter of splice is the number of elements to remove. Note that splice modifies the array in place and returns a new array containing the elements that have been removed. 
        }
    };

    that.get_all_properties = function () {
        var properties = [];
        for (var prop in that) {
            if (typeof that[prop] != 'function') {
                properties.push(prop);
            }
        }
        return properties;
    };

    return that;
};

/*****************************/
/*Host                       */
/*****************************/
var host = function (spec) {
    var that = component(spec); //the inheritance
    that.ip = spec.ip || '127.0.0.1';
    that.port = spec.port || ['80', '22'];
    that.credentials = spec.credentials || {
        login: 'ubuntu',
        password: 'ubuntu'
    };

    return that;
};

/*****************************/
/*Controler                 */
/*****************************/
var controler = function (spec) {
    var that = component(spec); //the inheritance


    return that;
};

/*****************************/
/*Flow                       */
/*****************************/
var flow = function (spec) {
    var that = component(spec); //the inheritance
    that.path_to_flow = spec.path_to_flow || '/home/ubuntu';

    return that;
};

// To be completed - This is the list of things that should be extensible.
/*****************************/
/* Docker HOST               */
/*****************************/
var docker_host = function (spec) {
    var that = host(spec);
    that._type = "docker_host";

    return that;
};

/*****************************/
/* VM Host                   */
/*****************************/
var vm_host = function (spec) {
    var that = host(spec);
    that._type = "vm_host";

    return that;
};

/*****************************/
/*****************************/
var external_host = function (spec) {
    var that = host(spec);
    that._type = "external_host";


    return that;
};

/*****************************/
/*****************************/
var software_node = function (spec) {
    var that = component(spec);
    that.id_host = spec.id_host || null;
    that.docker_resource = spec.docker_resource || docker_resource({});
    that.ssh_resource = spec.ssh_resource || ssh_resource({});

    return that;
};

/*****************************/
/*****************************/
var node_red = function (spec) {
    var that = software_node(spec); //the inheritance
    that.port = spec.port || '1880';
    that._type = "node_red";

    return that;
};

/*****************************/
/*External node              */
/*****************************/
var external_node = function (spec) {
    var that = software_node(spec); //the inheritance
    that._type = "external_node";

    return that;
};

/*****************************/
/*Link                       */
/*****************************/
var link = function (spec) {
    var that = component(spec);
    that.src = spec.src || null;
    that.target = spec.target || null;

    return that;
}

/*****************************/
/*Docker resource             */
/*****************************/
var docker_resource = function (spec) {
    var that = {};
    that.name = spec.name || "a resource";
    that.image = spec.image || "ubuntu";
    that.command = spec.command || "";
    that.port_bindings = spec.port_bindings || {
        "80": "80",
        "22": "22"
    };
    that.devices = spec.devices || {
        "PathOnHost": '',
        "PathInContainer": '',
        "CgroupPermissions": "rwm"
    }

    return that;
}

/*****************************/
/*SSH resource               */
/*****************************/
var ssh_resource = function (spec) {
    var that = {};
    that.name = spec.name || "a resource";
    that.startCommand = spec.startCommand || "";
    that.downloadCommand = spec.downloadCommand || "";
    that.configureCommand = spec.downloadCommand || "";

    return that;
}


/***************************************/
/*Factory to create component from type*/
/***************************************/
var node_factory = function () {
    var component;

    this.create_component = function (type, spec) {
        if (type === "external_host") {
            component = external_host(spec);
        } else if (type === "vm_host") {
            component = vm_host(spec);
        } else if (type === "docker_host") {
            component = docker_host(spec);
        } else if (type === "external_node") {
            component = external_node(spec);
        } else if (type === "node_red") {
            component = node_red(spec);
        } else if (type === "controller") {
            component = controler(spec);
        }

        return component;
    }
    return this;
};



////////////////////////////////////////////////
module.exports = {
    deployment_model: deployment_model,
    node_factory: node_factory,
    ssh_resource: ssh_resource,
    docker_resource: docker_resource,
    link: link,
    external_node: external_node,
    node_red: node_red,
    software_node: software_node,
    external_host: external_host,
    vm_host: vm_host,
    docker_host: docker_host,
    flow: flow,
    controler: controler,
    host: host,
    component: component
}