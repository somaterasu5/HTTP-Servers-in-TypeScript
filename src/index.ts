import express from "express";
import { Request, Response, NextFunction } from "express";
import config from "./config.js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import {
  clearUserRecords,
  createUser,
  getUserByEmail,
} from "./db/queries/users.js";
import { createChirp } from "./db/queries/chirps.js";

const app = express();
const PORT = config.api.port;

app.use(express.json());

const migrationClient = postgres(config.db.url, { max: 1 });
await migrate(drizzle(migrationClient), config.db.migrationConfig);

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
  config.api.fileserverHits += 1;
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
    <p>Chirpy has been visited ${config.api.fileserverHits} times!</p>
  </body>
</html>`);
};

const handleResetServerMetrics = async (req: Request, res: Response) => {
  if (config.api.platform !== "dev") {
    throw new ForbiddenError("Cannot perform the action");
  }
  config.api.fileserverHits = 0;

  await clearUserRecords();

  res.send("Metrics Reset.");
};

const handleCreateChirp = async (req: Request, res: Response) => {
  let chirp = req.body?.body;
  const user = req.body.userId;
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

  const initiateChirp = await createChirp({ body: chirp, userId: user });

  res.status(201).send(initiateChirp);
};

const handleUsers = async (req: Request, res: Response) => {
  const email = req.body?.email;

  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "email is required" });
  }

  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return res.status(409).json({ error: "User already exists" });
  }

  const user = await createUser({ email });

  return res.status(201).json(user);
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

app.post("/api/chirps", handleCreateChirp);

app.post("/api/users", handleUsers);

app.use(errorHandler);

app.listen(PORT, () => console.log(`listening on port: ${PORT}`));
