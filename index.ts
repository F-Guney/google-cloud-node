import express, { Application } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import computeRoute from "./routers/compute/route";

const app: Application = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/compute", computeRoute);

app.listen(8000, () => {
  console.log("Hello World");
});

export default app;
