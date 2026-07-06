import express from "express";
import { Request, Response, NextFunction } from "express";
import config from "./config.js";

const app = express();
const PORT = 8080;

app.use(express.json());

class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
  }
}
class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
  }
}
class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
  }
}
class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
  }
}

const middlewareLogResponses = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const method = req.method;
  const url = req.url;

  res.on("finish", () => {
    const statusCode = res.statusCode;
    if (statusCode !== 200) {
      console.log(`[NON-OK] ${method} ${url} - Status: ${statusCode}`);
    }
  });

  next();
};

const middlewareMetricsInc = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  config.fileserverHits += 1;
  next();
};

app.use(middlewareLogResponses);

app.use("/app", middlewareMetricsInc, express.static("./src/app"));

const handlerReadiness = async (req: Request, res: Response) => {
  res.set("Content-Type", "text/plain");
  res.set("charset", "utf-8");
  res.status(200);
  res.send("OK");
};

const handle404 = async (req: Request, res: Response) => {
  res.status(404);
  res.send("Not Ok");
};

const handleServerMetrics = async (req: Request, res: Response) => {
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(`<html>
  <body>
    <h1>Welcome, Chirpy Admin</h1>
    <p>Chirpy has been visited ${config.fileserverHits} times!</p>
  </body>
</html>`);
};

const handleResetServerMetrics = async (req: Request, res: Response) => {
  config.fileserverHits = 0;

  res.send("Metrics Reset.");
};

const handleValidateChirp = async (req: Request, res: Response) => {
  let chirp = req.body?.body;
  const profaneWords = ["kerfuffle", "sharbert", "fornax"];

  if (chirp.length > 140) {
    throw new BadRequestError("Chirp is too long. Max length is 140");
  }

  let chirpWords = chirp.split(" ");
  let cleanedChirp = [];

  if (chirpWords.length > 0) {
    for (let i = 0; i < chirpWords.length; i++) {
      if (profaneWords.includes(chirpWords[i].toLowerCase())) {
        cleanedChirp.push("****");
      } else {
        cleanedChirp.push(chirpWords[i]);
      }
    }
  }

  res.status(200).send({
    cleanedBody: cleanedChirp.join(" "),
  });
};

function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.log(error);
  if (error instanceof BadRequestError) {
    res.status(400).json({ error: error.message });
  } else {
    res.status(500).json({ error: "Something went wrong on our end" });
  }
}

app.get("/api/healthz", handlerReadiness);

app.get("/api/non-existent-path", handle404);

app.get("/admin/metrics", handleServerMetrics);

app.post("/admin/reset", handleResetServerMetrics);

app.post("/api/validate_chirp", handleValidateChirp);

app.use(errorHandler);

app.listen(PORT, () => console.log(`listening on port: ${PORT}`));
