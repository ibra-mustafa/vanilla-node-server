import express from "express";
import config from "./config.js";
const app = express();
const PORT = 8080;
const handlerReadiness = (req, res) => {
    res.set("Content-Type", "text/plain");
    res.set("charset", "utf-8");
    res.send("OK");
};
class NotFoundError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}
app.get("/admin/metrics", (req, res, next) => {
    try {
        res.status(200).header("Content-Type", "text/html; charset=utf-8").send(`<html>
  <body>
    <h1>Welcome, Chirpy Admin</h1>
    <p>Chirpy has been visited ${config.fileserverHits} times!</p>
  </body>
</html>`);
        app.get("/api/healthz", handlerReadiness);
    }
    catch (err) {
        next(err); // Pass the error to Express
    }
});
app.use(middlewareLogResponses);
app.use(middlewareMetricsInc);
app.post("/admin/reset", (req, res, next) => {
    try {
        config.fileserverHits = 0;
        res.status(200).send(`Hits: ${config.fileserverHits}`);
    }
    catch (err) {
        next(err); // Pass the error to Express
    }
});
app.post("/api/validate_chirp", (req, res, NextFunction) => {
    try {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk;
        });
        req.on("end", () => {
            try {
                const profane = ["kerfuffle", "sharbert", "fornax"];
                const parsedBody = JSON.parse(body);
                const arr_words = parsedBody.body.split(" ");
                if (parsedBody.body.length > 140) {
                    throw new NotFoundError("Chirp is too long. Max length is 140", 400);
                }
                console.log(arr_words.length);
                const filtered = arr_words.map((word, i) => {
                    if (profane.includes(word.toLowerCase())) {
                        return "****";
                    }
                    return word;
                });
                res.status(200).send({ "cleanedBody": filtered.join(" ") });
            }
            catch (err) {
                NextFunction(err);
            }
        });
    }
    catch (err) {
        NextFunction(err); // Pass the error to Express
    }
});
// app.use("/app", express.static("./src/app"));
app.use(errorHandler);
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
function middlewareLogResponses(req, res, next) {
    try {
        res.on("finish", () => {
            const status = res.statusCode;
            if (status <= 200 && status < 300) {
            }
            else {
                console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${res.statusCode}`);
            }
        });
        next();
    }
    catch (err) {
        next(err); // Pass the error to Express
    }
}
function middlewareMetricsInc(req, res, next) {
    try {
        if (req.url === "/metrics") {
            return next();
        }
        config.fileserverHits += 1;
        next();
    }
    catch (err) {
        next(err); // Pass the error to Express
    }
}
function errorHandler(err, req, res, next) {
    console.error("Uh oh, spaghetti-o");
    if (err instanceof NotFoundError) {
        return res.status(err.statusCode).json({
            error: err.message,
        });
    }
    else {
        res.status(500).json({
            error: "Something went wrong on our end"
        });
    }
}
