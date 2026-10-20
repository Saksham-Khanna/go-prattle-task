import { Router } from "express";
import {
  createRequirementController,
  getRequirementController,
  listRequirementsController,
} from "../controllers/requirement.controller";

export const requirementsRouter = Router();

requirementsRouter.post("/", createRequirementController);
requirementsRouter.get("/", listRequirementsController);
requirementsRouter.get("/:id", getRequirementController);
