import express, { Request, Response } from "express";
import { InstancesClient } from "@google-cloud/compute";
import auth from "../../lib/google";

const router = express.Router();

interface VmPowerRequestBody {
  zone: string;
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
        instance.zone;
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

router.post(
  "/:name/power",
  async (
    req: Request<{ name: string }, any, VmPowerRequestBody>,
    res: Response
  ) => {
    try {
      const { name } = req.params;
      const { zone, option } = req.body;
      const computeClient = new InstancesClient({ auth });

      const vmPowerOptions = {
        start: (request: any) => computeClient.start(request),
        resume: (request: any) => computeClient.resume(request),
        stop: (request: any) => computeClient.stop(request),
        suspend: (request: any) => computeClient.suspend(request),
        reset: (request: any) => computeClient.reset(request),
      };

      if (!vmPowerOptions.hasOwnProperty(option)) {
        throw new Error("Unsupported option");
      }

      await vmPowerOptions[option]({
        instance: name,
        project: await computeClient.getProjectId(),
        zone: zone,
      });

      res.send({ message: "Analiz ediliyoru" });
    } catch (error: any) {
      console.log(error);
      res.send({ error: error.message });
    }
  }
);

export default router;
