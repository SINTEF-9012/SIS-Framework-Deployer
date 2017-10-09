# SIS-Framework-Deployer
The SIS-Framework aims to facilitate the engineering and continuous deployment of smart IoT systems, allowing decentralized processing across heterogeneous the IoT, edge and cloud space. The SIS-Framework includes: (i) a domain specific modelling language to model the orchestration and deployment of smart IoT systems across the IoT, edge and cloud spaces; and (ii) an execution engine that will support the orchestration of IoT, edge and cloud services as well as their automatic deployment over IoT, edge and cloud resources.

## Metamodel (To be completed)
The SIS-Framework Modelling language is inspired by component-based approaches in order to facilitate separation of concerns and reusability. In this respect, deployment models can be regarded as assemblies of components exposing ports, and bindings between these ports.

A Component represents a reusable type of software component of a smart IoT system. A Component can be an ExternalComponent xxx (e.g., a database) or an InternalComponent xxx (e.g., an instance of SIS-Node). A component can be associated to Resources. A Resource represents an artefact (e.g., scripts, Docker Containers, etc.) adopted to manage the deployment life-cycle (e.g., download, configure, install, start, and stop). 

An Host represents a reusable type of xxx that can host Components. A Host can be ExternalHost managed and provided third party or an InternalHost on top of which, Components can be managed and deployed by the SIS-Framework.  

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
