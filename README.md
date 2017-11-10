# SIS-Framework-Deployer
In the past years, multiple tools have emerged to support the building as well as the automated and continuous deployment of software systems with a specific focus on cloud infrastructures (e.g., Puppet, Chef, Ansible, Vagrant, Brooklyn, CloudML, etc.). However, very little effort has been spent on providing solution for the delivery and deployment of application across the whole IoT, edge and cloud space. In particular, there is a lack of languages and abstractions that can be used to support the orchestration of software services and their deployment on heterogeneous devices.

The SIS-Framework aims to facilitate the engineering and continuous deployment of smart IoT systems, allowing decentralized processing across heterogeneous the IoT, edge and cloud space. The SIS-Framework includes: (i) a domain specific modelling language to model the orchestration and deployment of smart IoT systems across the IoT, edge and cloud spaces; and (ii) an execution engine that will support the orchestration of IoT, edge and cloud services as well as their automatic deployment over IoT, edge and cloud resources.

## Metamodel (To be completed)
The SIS-Framework Modelling language is inspired by component-based approaches in order to facilitate separation of concerns and reusability. In this respect, deployment models can be regarded as assemblies of components exposing ports, and bindings between these ports.

A _component_ represents a reusable type of software component of a smart IoT system. A _Component_ can be an _ExternalComponent_ xxx (e.g., a database) or an _InternalComponent_ xxx (e.g., an instance of SIS-Node). A _component_ can be associated to _Resources_. A _Resource_ represents an artefact (e.g., scripts, Docker Images, etc.) adopted to manage the deployment life-cycle (e.g., download, configure, install, start, and stop). 

An _Host_ represents a reusable type of xxx that can host _Components_ (e.g., Raspberry pi, Docker engine, Virtual Machine). A _Host_ can be _ExternalHost_ managed and provided third party or an _InternalHost_ on top of which, _Components_ can be managed and deployed by the SIS-Framework. A _Virtual Machine_ is a specific type of Host that can be dynamically provisioned by the SIS-Framework. 

Inspired by CloudML (cf. http://cloudml.org), _Virtual Machine_ are characterized by the following properties. The properties _minCores_, _maxCores_, _minRam_, _maxRam_, _minStorage_, and _maxStorage_ represent the lower and upper bounds of virtual compute cores, RAM, and storage, respectively, of the required VM (e.g., _minCores_=1, _minRam_=1024). The property _OS_ represents the operating system to be run by the VM (e.g., _OS_="ubuntu"). These properties, which are provider independent, are used as constraints during the provisioning process in order to become provider specific. All these are optional and do not have to be defined.

## Installation
If you want to run the latest code from git, here's how to get started:

1. Clone the code:

        git clone https://github.com/SINTEF-9012/SIS-Framework-Deployer.git
        cd SIS-Framework-Deployer

2. Install the dependencies

        npm install

4. Run

        npm start

## Architecture
