import express from "express";
import e, { Response, Request } from "express";
import config from "./config.js";
const app = express();
const PORT = 8080;
const handlerReadiness = (req: Request ,res: Response)=> {
  res.set("Content-Type", "text/plain")
  res.set("charset", "utf-8")
  res.send("OK")
}
app.get("/healthz", handlerReadiness)
app.use(middlewareLogResponses);
app.use(middlewareMetricsInc);
app.get("/metrics",(req, res) => {
  res.status(200).send(`Hits: ${config.fileserverHits}`);
})
app.get("/reset",(req, res) => {
  config.fileserverHits = 0;
  res.status(200).send(`Hits: ${config.fileserverHits}`);
})
app.use("/app", express.static("./src/app"));
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
function middlewareLogResponses (req: Request, res: Response, next: Function) {
res.on("finish", () => {
    const status = res.statusCode
    if(status <= 200 && status <300 ){
    }else{console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${res.statusCode}`)
    }
  });
  next()
}
function middlewareMetricsInc(req: Request, res: Response, next: Function) {
  if(req.url === "/metrics") {
    return next();
  }
  config.fileserverHits += 1;
  next();
}