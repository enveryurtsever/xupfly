import { pgTable, uuid, text, boolean, integer, timestamp, pgEnum, jsonb, varchar, decimal, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── ENUMS ───────────────────────────────────────────────────────────────────
export const userRoleEnum = pgEnum("user_role", ["admin", "customer"]);
export const interactionTypeEnum = pgEnum("interaction_type", ["tweet", "retweet", "quote", "reply", "thread"]);
export const postStatusEnum = pgEnum("post_status", ["draft", "pending_approval", "approved", "scheduled", "published", "failed"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["PURCHASE", "USAGE", "REFUND", "BONUS"]);

// ─── 1. USERS ─────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name"),
  role: userRoleEnum("role").default("customer"),
  totalCredits: integer("total_credits").default(100),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── 2. NICHES ────────────────────────────────────────────────────────────────
export const niches = pgTable("niches", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").unique().notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── 3. X ACCOUNTS ────────────────────────────────────────────────────────────
export const xAccounts = pgTable("x_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: "cascade" }),
  xUserId: text("x_user_id").unique(),
  screenName: text("screen_name"),
  avatarUrl: text("avatar_url"),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  nicheId: uuid("niche_id").references(() => niches.id),
  automationEnabled: boolean("automation_enabled").default(false),
  styleContext: text("style_context"), // Stored analysis of last 10 posts
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── 4. SEARCH CONFIGS ────────────────────────────────────────────────────────
export const searchConfigs = pgTable("search_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  nicheId: uuid("niche_id").references(() => niches.id, { onDelete: "cascade" }),
  queryTerm: text("query_term").notNull(),
  searchType: text("search_type").default("Top"),
  minFaves: integer("min_faves").default(0),
  minRetweets: integer("min_retweets").default(0),
  languageFilter: varchar("language_filter", { length: 5 }).default("en"),
  exclusiveOperators: text("exclusive_operators"),
  isActive: boolean("is_active").default(true),
  lastCursor: text("last_cursor"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── 5. EXTERNAL TWEET LIBRARY (The Buffer) ───────────────────────────────────
export const externalTweetLibrary = pgTable("external_tweet_library", {
  tweetId: text("tweet_id").primaryKey(),
  authorId: text("author_id").notNull(),
  authorHandle: text("author_handle"),
  contentText: text("content_text"),
  lang: varchar("lang", { length: 10 }),
  mediaJson: jsonb("media_json"),
  metricsJson: jsonb("metrics_json"),
  rawApiResponse: jsonb("raw_api_response"),
  firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).defaultNow(),
  lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true }).defaultNow(),
});

// ─── 6. EXTERNAL USER LIBRARY ─────────────────────────────────────────────────
export const externalUserLibrary = pgTable("external_user_library", {
  xUserId: text("x_user_id").primaryKey(),
  screenName: text("screen_name").unique(),
  displayName: text("display_name"),
  description: text("description"),
  avatarUrl: text("avatar_url"),
  followersCount: integer("followers_count"),
  isVerified: boolean("is_verified"),
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }).defaultNow(),
});

// ─── 7. GENERATED POSTS ───────────────────────────────────────────────────────
export const generatedPosts = pgTable("generated_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id").references(() => xAccounts.id, { onDelete: "cascade" }),
  sourceTweetId: text("source_tweet_id").references(() => externalTweetLibrary.tweetId, { onDelete: "set null" }),
  generatedText: text("generated_text").notNull(),
  mediaUrl: text("media_url"),
  mediaType: text("media_type"),
  mediaToUpload: jsonb("media_to_upload"),
  postType: interactionTypeEnum("post_type").default("tweet"),
  targetTweetId: text("target_tweet_id"),
  status: postStatusEnum("status").default("pending_approval"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  externalPlatformId: text("external_platform_id"),
  imagePrompt: text("image_prompt"),
  errorLog: text("error_log"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── 8. PRICING PLANS ─────────────────────────────────────────────────────────
export const pricingPlans = pgTable("pricing_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  planName: text("plan_name").notNull(),
  priceUsd: decimal("price_usd", { precision: 10, scale: 2 }).notNull(),
  creditAmount: integer("credit_amount").notNull(),
  isPopular: boolean("is_popular").default(false),
  stripePriceId: text("stripe_price_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── 9. CREDIT TRANSACTIONS ───────────────────────────────────────────────────
export const creditTransactions = pgTable("credit_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  accountId: uuid("account_id").references(() => xAccounts.id, { onDelete: "set null" }),
  amount: integer("amount").notNull(),
  type: transactionTypeEnum("type").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── 10. AUTOMATION RULES ─────────────────────────────────────────────────────
export const automationRules = pgTable("automation_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id").references(() => xAccounts.id, { onDelete: "cascade" }),
  dailyPostLimit: integer("daily_post_limit").default(3),
  dailyReplyLimit: integer("daily_reply_limit").default(0),
  dailyLikeLimit: integer("daily_like_limit").default(0),
  autoReply: boolean("auto_reply").default(false),
  autoLike: boolean("auto_like").default(false),
  smartRetweet: boolean("smart_retweet").default(false),
  aiWelcome: boolean("ai_welcome").default(false),
  preferredHours: integer("preferred_hours").array(),
  aiTone: text("ai_tone").default("professional and minimalist"),
  autoPublish: boolean("auto_publish").default(false),
  searchKeywords: text("search_keywords"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── 11. ENGINE LOGS ──────────────────────────────────────────────────────────
export const engineLogs = pgTable("engine_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id").references(() => xAccounts.id, { onDelete: "cascade" }),
  actionType: text("action_type").notNull(), // 'like', 'post', 'reply', 'search', 'generate'
  description: text("description"),
  status: text("status").default("success"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── RELATIONS ────────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  xAccounts: many(xAccounts),
  creditTransactions: many(creditTransactions),
}));

export const xAccountsRelations = relations(xAccounts, ({ one, many }) => ({
  owner: one(users, { fields: [xAccounts.ownerId], references: [users.id] }),
  niche: one(niches, { fields: [xAccounts.nicheId], references: [niches.id] }),
  generatedPosts: many(generatedPosts),
  automationRules: many(automationRules),
  creditTransactions: many(creditTransactions),
}));

export const nichesRelations = relations(niches, ({ many }) => ({
  xAccounts: many(xAccounts),
  searchConfigs: many(searchConfigs),
}));

export const searchConfigsRelations = relations(searchConfigs, ({ one }) => ({
  niche: one(niches, { fields: [searchConfigs.nicheId], references: [niches.id] }),
}));

export const generatedPostsRelations = relations(generatedPosts, ({ one }) => ({
  account: one(xAccounts, { fields: [generatedPosts.accountId], references: [xAccounts.id] }),
  sourceTweet: one(externalTweetLibrary, { fields: [generatedPosts.sourceTweetId], references: [externalTweetLibrary.tweetId] }),
}));

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  user: one(users, { fields: [creditTransactions.userId], references: [users.id] }),
  account: one(xAccounts, { fields: [creditTransactions.accountId], references: [xAccounts.id] }),
}));

export const automationRulesRelations = relations(automationRules, ({ one }) => ({
  account: one(xAccounts, { fields: [automationRules.accountId], references: [xAccounts.id] }),
}));

// ─── TYPES ────────────────────────────────────────────────────────────────────
// ─── 11. SYSTEM SETTINGS (admin-editable config: credit costs, limits, etc.) ──
export const systemSettings = pgTable("system_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").unique().notNull(),       // e.g. "credit_cost_tweet"
  value: text("value").notNull(),             // stored as string, parsed at read time
  label: text("label").notNull(),             // human-readable label for admin UI
  description: text("description"),           // tooltip / help text
  category: text("category").default("credits"), // "credits" | "limits" | "ai" | "general"
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const mentions = pgTable("mentions", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id").references(() => xAccounts.id, { onDelete: "cascade" }),
  externalId: text("external_id").unique(),
  authorHandle: text("author_handle"),
  authorName: text("author_name"),
  authorAvatar: text("author_avatar"),
  contentText: text("content_text"),
  repliedToTweetId: text("replied_to_tweet_id"),
  isRead: boolean("is_read").default(false),
  aiReplyId: uuid("ai_reply_id").references(() => generatedPosts.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── TYPES ────────────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type XAccount = typeof xAccounts.$inferSelect;
export type NewXAccount = typeof xAccounts.$inferInsert;
export type Niche = typeof niches.$inferSelect;
export type GeneratedPost = typeof generatedPosts.$inferSelect;
export type NewGeneratedPost = typeof generatedPosts.$inferInsert;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type SearchConfig = typeof searchConfigs.$inferSelect;
export type ExternalTweet = typeof externalTweetLibrary.$inferSelect;
export type AutomationRule = typeof automationRules.$inferSelect;
export type SystemSetting = typeof systemSettings.$inferSelect;
