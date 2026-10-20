import { asyncHandler } from "../utils/asyncHandler";
import { ApiError, type FieldError } from "../utils/ApiError";
import {
  createRequirement,
  getRequirementById,
  listRequirements,
} from "../services/requirement.service";
import { requirementPayloadSchema } from "../validators/requirement";

/**
 * POST /api/requirements
 * 201 → created · 400 → validation failed (per-field errors)
 */
export const createRequirementController = asyncHandler(async (req, res) => {
  const result = requirementPayloadSchema.safeParse(req.body);
  if (!result.success) {
    const errors: FieldError[] = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    throw new ApiError(400, "Validation failed", errors);
  }

  const doc = await createRequirement(result.data);
  res.status(201).json({
    success: true,
    message: "Requirement created successfully",
    data: {
      id: doc.id,
      category: doc.category,
      status: doc.status,
    },
  });
});

/**
 * GET /api/requirements/:id
 * 200 → found · 400 → malformed id · 404 → not found
 */
export const getRequirementController = asyncHandler(async (req, res) => {
  const record = await getRequirementById(req.params.id);
  res.json({ success: true, data: record });
});

/**
 * GET /api/requirements
 * 200 → list of records
 */
export const listRequirementsController = asyncHandler(async (_req, res) => {
  const data = await listRequirements();
  res.json({ success: true, count: data.length, data });
});
