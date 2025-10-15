/**
 * Server actions barrel export
 *
 * Centralized exports for all server actions in the application.
 *
 * @module app/actions
 */

// Auth actions (re-export existing)
export { loginAction } from "../[locale]/login/actions";
export { logoutAction } from "../logout/actions";
// Projects actions
export {
  createProjectAction,
  deleteProjectAction,
  updateProjectAction,
} from "./projects";
// Work categories actions
export {
  createWorkCategoryAction,
  deleteWorkCategoryAction,
  updateWorkCategoryAction,
} from "./work-categories";
// Work logs actions
export {
  createWorkLogAction,
  deleteWorkLogAction,
  updateWorkLogAction,
} from "./work-logs";
