# Cosmos DB - Multi Master Ignite 2018 Demo

This repo contains the source code for the Cosmos DB Multi Master demo shown at Ignite 2018 by Mark Russinovich.

## Overview

This demo simulates a massive global scale ticket sell scenario.
It starts with Calm Mode - where tickets are sold from the East US region.
<br>
Panic Mode simulates a ticket rush from 3 regions - East US, North Europe and East Japan.
<br>
Extreme Panic Mode simulates ticket sales from 14 regions in extremely high capacity.

The demo shown at Ignite used a 100TB Cosmos DB, and shows how latency remains consistent with multiple high volume writes from different regions.

## Setup

The steps below outline how to simulate the demo environment used in the 2018 Ignite session. Feel free to make changes that suit your needs.

### Prerequisites

* [CosmosDB](https://docs.microsoft.com/en-us/azure/cosmos-db/)
* [AKS Kubernetes Cluster](https://docs.microsoft.com/en-us/azure/aks/) - 14 Clusters, one for each region
* [Mapbox Account](https://www.mapbox.com/)

#### Cosmos DB Setup

Create a Cosmos DB account in East US with the SQL API protocol.
Then, create a database named 'demo' with a collection named 'events'.

The events collection should be set to at least 150,000 RUs.
The partition key for the events collection should be '/id'.

Enable Geo-regional writes for the following regions:

westus, eastus, southcentralus, northcentralus, centralus, centralcanada, northeurope, eastcanada, eastjapan, southbrazil, centralfrance, southuk, westuk, southeastaustralia

#### AKS Clusters Setup

The AKS clusters will host the ticket writer containers used to generate load on the Cosmos database.
Use the following recommended configuration to create a cluster in each of the following regions:

westus, eastus, southcentralus, northcentralus, centralus, centralcanada, northeurope, eastcanada, eastjapan, southbrazil, centralfrance, southuk, westuk, southeastaustralia

```
az aks create --resource-group <your-resource-group> -n <cluster-name> --node-count 3 --generate-ssh-keys
```

Gather the kubeconfigs from every cluster and name them in an easy to understand convention, such as `eastus_kubeconfig`.
Put all kubeconfigs under `web_app/kubeconfigs/all`, and eastus, northeurope and eastjapan under `web_app/kubeconfigs/panic`.

#### Mapbox Setup

Once you created an account in Mapbox, get the token and copy it.
Edit `web_app/js/viewmodels/app.viewmodel.js` and paste the token as the value for the `var mapboxToken = '';` variable.

### Deployment

Hooray, by now you should have a Cosmos DB account in east us with an events collection containing at least 150,000 RUs, a Mapbox account, and 14 AKS clusters spread out in each of the regions mentioned above.

Edit `./deploy/data_generator.yaml` and `./deploy/webapp.yaml` and put the corresponding values in the environment variables.
You'll need the Cosmos DB URI, Auth key, Region, Database ID and Collection Name.

#### Deploy the Dashboard

Deploy the following to the East US AKS cluster:

```
kubectl apply -f ./deploy/webapp.yaml
```

Wait until the External IP shows up:

```
kubectl get svc cosmos-dashboard
```

Point your browser to the External IP and the Dashboard should show up!


#### Deploy the data writers

For each region, replace the `REGION` environment variable in the corresponding `data_generator.yaml` file.
Ideally you'd have 14 copies of this file, each with the `REGION` env var corresponding to each of the following regions:

westus, eastus, southcentralus, northcentralus, centralus, centralcanada, northeurope, eastcanada, eastjapan, southbrazil, centralfrance, southuk, westuk, southeastaustralia

For each region except for East US, set `spec.replicas` to `0` in `data_generator.yaml`
Deploy the writers:

```
kubectl apply -f ./deploy/data_generator.yaml
```

#### You're done

Now you should be able to see the ticket sales data in the UI and the metrics changing in real time.
Have fun with Panic and Extreme Panic modes!
