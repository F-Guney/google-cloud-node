import express from "express";
import compute from "@google-cloud/compute";

const router = express.Router();

router.get("/", () => {
  const instanceClient = new compute.InstancesClient();
  const aggListRequest = instanceClient.aggregatedListAsync({
    project: projectId,
    maxResults: 5,
  });

  console.log("Instances found:");

  // Despite using the `maxResults` parameter, you don't need to handle the pagination
  // yourself. The returned object handles pagination automatically,
  // requesting next pages as you iterate over the results.
  for await (const [zone, instancesObject] of aggListRequest) {
    const instances = instancesObject.instances;

    if (instances && instances.length > 0) {
      console.log(` ${zone}`);
      for (const instance of instances) {
        console.log(` - ${instance.name} (${instance.machineType})`);
      }
    }
  }
});
