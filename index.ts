import express, { Application } from "express";

const app: Application = express();

app.listen(8000, () => {
  console.log("Hello World");
});

export default app;
