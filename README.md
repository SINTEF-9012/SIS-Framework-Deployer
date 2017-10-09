# SIS-Framework-Deployer
The SIS-Framework aims to facilitate the engineering and continuous deployment of smart IoT systems, allowing decentralized processing across heterogeneous the IoT, edge and cloud space. The SIS-Framework includes: (i) a domain specific modelling language to model the orchestration and deployment of smart IoT systems across the IoT, edge and cloud spaces; and (ii) an execution engine that will support the orchestration of IoT, edge and cloud services as well as their automatic deployment over IoT, edge and cloud resources.

## Metamodel (To be completed)
The SIS-Framework Modelling language is inspired by component-based approaches in order to facilitate separation of concerns and reusability. In this respect, deployment models can be regarded as assemblies of components exposing ports, and bindings between these ports.

A _component_ represents a reusable type of software component of a smart IoT system. A _Component_ can be an _ExternalComponent_ xxx (e.g., a database) or an _InternalComponent_ xxx (e.g., an instance of SIS-Node). A _component_ can be associated to _Resources_. A _Resource_ represents an artefact (e.g., scripts, Docker Containers, etc.) adopted to manage the deployment life-cycle (e.g., download, configure, install, start, and stop). 

An _Host_ represents a reusable type of xxx that can host _Components_. A _Host_ can be _ExternalHost_ managed and provided third party or an _InternalHost_ on top of which, _Components_ can be managed and deployed by the SIS-Framework.  

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
