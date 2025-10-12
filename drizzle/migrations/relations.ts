import { relations } from "drizzle-orm/relations";
import {
  accounts,
  projects,
  sessions,
  users,
  workCategories,
  workLogs,
} from "./schema";

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  workLogs: many(workLogs),
  accounts: many(accounts),
}));

export const workLogsRelations = relations(workLogs, ({ one }) => ({
  user: one(users, {
    fields: [workLogs.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [workLogs.projectId],
    references: [projects.id],
  }),
  workCategory: one(workCategories, {
    fields: [workLogs.categoryId],
    references: [workCategories.id],
  }),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  workLogs: many(workLogs),
}));

export const workCategoriesRelations = relations(
  workCategories,
  ({ many }) => ({
    workLogs: many(workLogs),
  }),
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));
