import express, { Request, Response } from "express";
import { Storage } from "@google-cloud/storage";
import auth from "../../lib/google";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const storage = new Storage({ authClient: auth });
    const [buckets] = await storage.getBuckets();
    const list = [];
    for await (const bucket of buckets) {
      list.push({
        name: bucket.name,
        createdAt: bucket.metadata.timeCreated,
        location: bucket.metadata.location,
        storageClass: bucket.metadata.storageClass,
        locationType: bucket.metadata.locationType,
        updatedAt: bucket.metadata.updated,
      });
    }

    res.send(list);
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
});

router.get("/:name", async (req: Request<{ name: string }>, res: Response) => {
  try {
    const { name } = req.params;
    const storage = new Storage({ authClient: auth });
    const [files] = await storage.bucket(name).getFiles();
    const list = [];
    for await (const file of files) {
      list.push({
        name: file.name,
        size: file.metadata.size,
        contentType: file.metadata.contentType,
        createdAt: file.metadata.timeCreated,
        updatedAt: file.metadata.updated,
        storageClass: file.metadata.storageClass,
      });
    }

    res.send(list);
  } catch (error: any) {
    res.status(500).send({ message: error.mesaage });
  }
});

router.get(
  "/:name/:fileName/download",
  async (req: Request<{ name: string; fileName: string }>, res: Response) => {
    try {
      const { name, fileName } = req.params;
      const storage = new Storage({ authClient: auth });
      const [url] = await storage
        .bucket(name)
        .file(fileName)
        .getSignedUrl({
          version: "v4",
          action: "read",
          expires: Date.now() + 15 * 60 * 1000,
        });

      res.status(200).send({ url });
    } catch (error: any) {
      res.status(500).send({ message: error.message });
    }
  }
);
export default router;
