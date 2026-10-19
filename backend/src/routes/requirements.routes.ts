import { Router } from "express";
import {
  createRequirementController,
  getRequirementController,
} from "../controllers/requirement.controller";

export const requirementsRouter = Router();

requirementsRouter.post("/", createRequirementController);
requirementsRouter.get("/:id", getRequirementController);
