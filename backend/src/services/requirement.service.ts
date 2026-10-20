import mongoose from "mongoose";
import { Requirement, type RequirementDoc } from "../models/Requirement";
import {
  dateRangeError,
  todayIsoDate,
  type RequirementPayload,
} from "../validators/requirement";
import { ApiError } from "../utils/ApiError";

/**
 * Create a requirement. The payload is already Zod-validated by the
 * controller; this layer re-applies the date rules defensively and converts
 * ISO date strings to Date objects for storage.
 */
export async function createRequirement(
  payload: RequirementPayload,
): Promise<RequirementDoc> {
  if (payload.startDate < todayIsoDate()) {
    throw new ApiError(400, "Validation failed", [
      { field: "startDate", message: "Event date can't be in the past." },
    ]);
  }

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

export function serializeRequirement(doc: RequirementDoc) {
  const obj = doc.toObject ? doc.toObject() : doc;
  const formatDateOnly = (d: Date | string | null) => {
    if (!d) return null;
    const dateObj = d instanceof Date ? d : new Date(d);
    if (isNaN(dateObj.getTime())) return String(d);
    return dateObj.toISOString().split("T")[0];
  };

  return {
    id: String(obj._id ?? obj.id),
    eventName: obj.eventName,
    eventType: obj.eventType,
    startDate: formatDateOnly(obj.startDate),
    endDate: formatDateOnly(obj.endDate),
    location: obj.location,
    venue: obj.venue ?? null,
    category: obj.category,
    requirements: obj.requirements,
    additionalDetails: obj.additionalDetails,
    status: obj.status ?? "submitted",
    createdAt: obj.createdAt instanceof Date ? obj.createdAt.toISOString() : new Date(obj.createdAt).toISOString(),
    updatedAt: obj.updatedAt instanceof Date ? obj.updatedAt.toISOString() : new Date(obj.updatedAt).toISOString(),
  };
}

/** Fetch one requirement by Mongo ObjectId, with format + existence checks. */
export async function getRequirementById(
  id: string,
): Promise<ReturnType<typeof serializeRequirement>> {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid requirement ID format");
  }
  const doc = await Requirement.findById(id).exec();
  if (!doc) {
    throw new ApiError(404, "Requirement not found");
  }
  return serializeRequirement(doc);
}

/** List requirements (convenience endpoint for sandbox/verification). */
export async function listRequirements(limit = 50) {
  const docs = await Requirement.find().sort({ createdAt: -1 }).limit(limit).exec();
  return docs.map(serializeRequirement);
}
