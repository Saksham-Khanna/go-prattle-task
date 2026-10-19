import mongoose from "mongoose";
import { Requirement, type RequirementDoc } from "../models/Requirement";
import {
  dateRangeError,
  type RequirementPayload,
} from "../validators/requirement";
import { ApiError } from "../utils/ApiError";

/**
 * Create a requirement. The payload is already Zod-validated by the
 * controller; this layer adds the date-range cross-field rule and
 * converts ISO date strings to Date objects for storage.
 */
export async function createRequirement(
  payload: RequirementPayload,
): Promise<RequirementDoc> {
  const rangeError = dateRangeError(payload.startDate, payload.endDate);
  if (rangeError) {
    throw new ApiError(400, "Validation failed", [
      { field: "endDate", message: rangeError },
    ]);
  }

  const { startDate, endDate, ...rest } = payload;
  return Requirement.create({
    ...rest,
    startDate: new Date(`${startDate}T00:00:00Z`),
    endDate: endDate ? new Date(`${endDate}T00:00:00Z`) : null,
  });
}

/** Fetch one requirement by Mongo ObjectId, with format + existence checks. */
export async function getRequirementById(
  id: string,
): Promise<RequirementDoc> {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid requirement ID format");
  }
  const doc = await Requirement.findById(id).exec();
  if (!doc) {
    throw new ApiError(404, "Requirement not found");
  }
  return doc;
}
