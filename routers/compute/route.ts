import express, { Request, Response } from "express";
import { InstancesClient } from "@google-cloud/compute";
import protos from "@google-cloud/compute/build/protos/protos";
import auth from "../../lib/google";

const router = express.Router();

async function findZone(instanceName: string) {
  const computeClient = new InstancesClient({ auth });
  const aggListRequest = computeClient.aggregatedListAsync({
    project: await computeClient.getProjectId(),
  });

  for await (const [zone, instancesObject] of aggListRequest) {
    const instances = instancesObject.instances;

    if (instances && instances.length > 0) {
      for (const instance of instances) {
        if (instance.name === instanceName) {
          const instanceZone = zone.split("/").pop();
          return instanceZone;
        }
      }
    }
  }
}

interface VmPowerRequestBody {
  option: "start" | "stop" | "suspend" | "reset" | "resume";
}

router.get("/", async (req, res) => {
  const instanceClient = new InstancesClient({ auth });
  const aggListRequest = instanceClient.aggregatedListAsync({
    project: await instanceClient.getProjectId(),
  });

  // Despite using the `maxResults` parameter, you don't need to handle the pagination
  // yourself. The returned object handles pagination automatically,
  // requesting next pages as you iterate over the results.
  const list = [];
  for await (const [zone, instancesObject] of aggListRequest) {
    const instances = instancesObject.instances;

    if (instances && instances.length > 0) {
      for (const instance of instances) {
        const instanceZone = zone.split("/").pop();
        list.push({
          id: instance.id,
          name: instance.name,
          zone: instanceZone,
          status: instance.status,
          statusMessage: instance.statusMessage,
        });
      }
    }
  }
  res.send(list);
});

router.get("/:name", async (req: Request<{ name: string }>, res: Response) => {
  try {
    const { name } = req.params;
    const computeClient = new InstancesClient({ auth });
    const instance = await computeClient.get({
      instance: name,
      project: await computeClient.getProjectId(),
      zone: await findZone(name),
    });

    res.send({
      data: instance[0],
      info: instance[1],
    });
  } catch (error: any) {
    console.log(error.message);
  }
});

router.post(
  "/:name/power",
  async (
    req: Request<{ name: string }, any, VmPowerRequestBody>,
    res: Response
  ) => {
    try {
      const { name } = req.params;
      const { option } = req.body;
      const computeClient = new InstancesClient({ auth });

      const vmPowerOptions = {
        start: (
          request: protos.google.cloud.compute.v1.IStartInstanceRequest
        ) => computeClient.start(request),
        resume: (
          request: protos.google.cloud.compute.v1.IResumeInstanceRequest
        ) => computeClient.resume(request),
        stop: (request: protos.google.cloud.compute.v1.IStopInstanceRequest) =>
          computeClient.stop(request),
        suspend: (
          request: protos.google.cloud.compute.v1.ISuspendInstanceRequest
        ) => computeClient.suspend(request),
        reset: (
          request: protos.google.cloud.compute.v1.IResetInstanceRequest
        ) => computeClient.reset(request),
      };

      if (!vmPowerOptions.hasOwnProperty(option)) {
        throw new Error("Unsupported option");
      }

      await vmPowerOptions[option]({
        instance: name,
        project: await computeClient.getProjectId(),
        zone: await findZone(name),
      });

      res.status(200).send({ message: "Waiting Response..." });
    } catch (error: any) {
      console.log(error);
      res.send({ error: error.message });
    }
  }
);

export default router;
