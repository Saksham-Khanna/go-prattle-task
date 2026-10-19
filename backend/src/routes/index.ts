import { Router } from "express";
import { healthController } from "../controllers/health.controller";
import { requirementsRouter } from "./requirements.routes";

export const apiRouter = Router();

apiRouter.get("/health", healthController);
apiRouter.use("/requirements", requirementsRouter);
