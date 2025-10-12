import {
  boolean,
  foreignKey,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: varchar({ length: 255 }),
    email: varchar({ length: 255 }).notNull(),
    emailVerified: timestamp("email_verified", { mode: "string" }),
    image: varchar({ length: 2048 }),
    passwordHash: varchar("password_hash", { length: 255 }),
    role: varchar({ length: 50 }).default("user").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique("users_email_unique").on(table.email)],
);

export const sessions = pgTable(
  "sessions",
  {
    sessionToken: varchar("session_token", { length: 255 })
      .primaryKey()
      .notNull(),
    userId: uuid("user_id").notNull(),
    expires: timestamp({ mode: "string" }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "sessions_user_id_users_id_fk",
    }).onDelete("cascade"),
  ],
);

export const workLogs = pgTable(
  "work_logs",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id").notNull(),
    date: timestamp({ mode: "string" }).notNull(),
    hours: varchar({ length: 10 }).notNull(),
    projectId: uuid("project_id").notNull(),
    categoryId: uuid("category_id").notNull(),
    details: text(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("work_logs_category_id_idx").using(
      "btree",
      table.categoryId.asc().nullsLast().op("uuid_ops"),
    ),
    index("work_logs_project_id_idx").using(
      "btree",
      table.projectId.asc().nullsLast().op("uuid_ops"),
    ),
    index("work_logs_user_id_date_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops"),
      table.date.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "work_logs_user_id_users_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "work_logs_project_id_projects_id_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [workCategories.id],
      name: "work_logs_category_id_work_categories_id_fk",
    }).onDelete("restrict"),
  ],
);

export const projects = pgTable(
  "projects",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: varchar({ length: 255 }).notNull(),
    description: text(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("projects_is_active_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
    unique("projects_name_unique").on(table.name),
  ],
);

export const workCategories = pgTable(
  "work_categories",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: varchar({ length: 255 }).notNull(),
    description: text(),
    displayOrder: integer("display_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("work_categories_is_active_display_order_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("int4_ops"),
      table.displayOrder.asc().nullsLast().op("int4_ops"),
    ),
    unique("work_categories_name_unique").on(table.name),
  ],
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: varchar({ length: 255 }).notNull(),
    token: varchar({ length: 255 }).notNull(),
    expires: timestamp({ mode: "string" }).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.identifier, table.token],
      name: "verification_tokens_identifier_token_pk",
    }),
    unique("verification_tokens_token_unique").on(table.token),
  ],
);

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id").notNull(),
    type: varchar({ length: 255 }).notNull(),
    provider: varchar({ length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", {
      length: 255,
    }).notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: varchar("token_type", { length: 255 }),
    scope: varchar({ length: 255 }),
    idToken: text("id_token"),
    sessionState: varchar("session_state", { length: 255 }),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "accounts_user_id_users_id_fk",
    }).onDelete("cascade"),
    primaryKey({
      columns: [table.provider, table.providerAccountId],
      name: "accounts_provider_provider_account_id_pk",
    }),
  ],
);
