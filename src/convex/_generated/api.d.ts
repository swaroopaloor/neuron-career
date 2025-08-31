/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as aiAnalysis from "../aiAnalysis.js";
import type * as aiCareerGrowth from "../aiCareerGrowth.js";
import type * as aiCareerGrowthData from "../aiCareerGrowthData.js";
import type * as aiResumeProcessor from "../aiResumeProcessor.js";
import type * as analyses from "../analyses.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as auth from "../auth.js";
import type * as fileUpload from "../fileUpload.js";
import type * as http from "../http.js";
import type * as jobApplications from "../jobApplications.js";
import type * as resumes from "../resumes.js";
import type * as seedResumeData from "../seedResumeData.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  aiAnalysis: typeof aiAnalysis;
  aiCareerGrowth: typeof aiCareerGrowth;
  aiCareerGrowthData: typeof aiCareerGrowthData;
  aiResumeProcessor: typeof aiResumeProcessor;
  analyses: typeof analyses;
  "auth/emailOtp": typeof auth_emailOtp;
  auth: typeof auth;
  fileUpload: typeof fileUpload;
  http: typeof http;
  jobApplications: typeof jobApplications;
  resumes: typeof resumes;
  seedResumeData: typeof seedResumeData;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
