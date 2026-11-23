import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { db } from "@/db";
import { systemSettings, pricingPlans, niches, searchConfigs, users } from "@/db/schema";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

async function seed() {
  console.log("🌱 Seeding database...");

  // ── Admin User ──────────────────────────────────────────────────────────────
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
  const generatedPassword = !process.env.SEED_ADMIN_PASSWORD;
  const adminPassword =
    process.env.SEED_ADMIN_PASSWORD || randomBytes(16).toString("base64url");

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await db.insert(users).values({
    email: adminEmail,
    passwordHash,
    fullName: "XUPFLY Admin",
    role: "admin",
    totalCredits: 99999,
  }).onConflictDoNothing();
  console.log(
    generatedPassword
      ? `✅ Admin user seeded (${adminEmail}) with generated password: ${adminPassword}`
      : `✅ Admin user seeded (${adminEmail}) using SEED_ADMIN_PASSWORD`
  );

  // ── System Settings (credit costs) ─────────────────────────────────────────
  const settings = [
    { key: "credit_cost_tweet",       value: "5",  label: "Credit cost per Tweet",         description: "Credits deducted when a tweet is published", category: "credits" },
    { key: "credit_cost_reply",       value: "3",  label: "Credit cost per Reply",          description: "Credits deducted when a reply is published", category: "credits" },
    { key: "credit_cost_retweet",     value: "1",  label: "Credit cost per Retweet",        description: "Credits deducted when a retweet is made", category: "credits" },
    { key: "credit_cost_quote",       value: "4",  label: "Credit cost per Quote Tweet",    description: "Credits deducted when a quote tweet is published", category: "credits" },
    { key: "credit_cost_thread",      value: "8",  label: "Credit cost per Thread",         description: "Credits deducted when a thread is published", category: "credits" },
    { key: "credit_cost_ai_generate", value: "2",  label: "Credit cost per AI Generation",  description: "Credits deducted per AI content generation", category: "credits" },
    { key: "starter_credits",         value: "100", label: "Starter Credits for New Users", description: "Credits awarded to new users on registration", category: "general" },
    { key: "max_accounts_per_user",   value: "5",  label: "Max X Accounts per User",        description: "Maximum number of X accounts a customer can connect", category: "limits" },
    { key: "daily_post_limit",        value: "10", label: "Default Daily Post Limit",       description: "Default max posts per account per day", category: "limits" },
    { key: "ai_provider",             value: "gemini", label: "AI Provider",               description: "Active AI provider: gemini | claude | openai", category: "ai" },
    { key: "ai_model",                value: "gemini-2.5-flash-preview-04-17", label: "AI Model Name", description: "Model identifier for the active provider", category: "ai" },
  ];

  for (const setting of settings) {
    await db.insert(systemSettings).values(setting).onConflictDoNothing();
  }
  console.log("✅ System settings seeded");

  // ── Pricing Plans ───────────────────────────────────────────────────────────
  const plans = [
    { planName: "Starter",    priceUsd: "9.99",  creditAmount: 500,   isPopular: false },
    { planName: "Pro",        priceUsd: "29.99", creditAmount: 2000,  isPopular: true  },
    { planName: "Agency",     priceUsd: "79.99", creditAmount: 7500,  isPopular: false },
    { planName: "Enterprise", priceUsd: "199.99", creditAmount: 25000, isPopular: false },
  ];

  for (const plan of plans) {
    await db.insert(pricingPlans).values(plan as never).onConflictDoNothing();
  }
  console.log("✅ Pricing plans seeded");

  // ── Niches ──────────────────────────────────────────────────────────────────
  const nicheList = [
    { name: "SaaS Builders",         description: "Software-as-a-Service founders and makers" },
    { name: "AI & Machine Learning", description: "Artificial intelligence, LLMs, and ML engineering" },
    { name: "Indie Hackers",         description: "Independent founders building profitable products" },
    { name: "Web3 & Crypto",         description: "Blockchain, DeFi, NFTs, and decentralized tech" },
    { name: "Personal Finance",      description: "Investing, saving, and financial independence" },
    { name: "Marketing & Growth",    description: "Growth hacking, SEO, and content marketing" },
    { name: "Productivity",          description: "Tools, systems, and mindsets for peak performance" },
    { name: "Tech Startups",         description: "Venture-backed startups and tech entrepreneurship" },
    { name: "News & Current Affairs", description: "Global news, politics, and trending events" },
    { name: "Entertainment & Pop Culture", description: "Movies, music, celebrities, and lifestyle" },
  ];

  for (const niche of nicheList) {
    await db.insert(niches).values(niche).onConflictDoNothing();
  }
  console.log("✅ Niches seeded");

  // ── Sample Search Configs ───────────────────────────────────────────────────
  const { eq } = await import("drizzle-orm");
  const [saasNiche] = await db.select().from(niches).where(eq(niches.name, "SaaS Builders")).limit(1).catch(() => []);

  if (saasNiche) {
    await db.insert(searchConfigs).values([
      { nicheId: saasNiche.id, queryTerm: "SaaS growth tips", minFaves: 100, minRetweets: 10, languageFilter: "en" },
      { nicheId: saasNiche.id, queryTerm: "indie hacker MRR milestone", minFaves: 50, minRetweets: 5, languageFilter: "en" },
    ]).onConflictDoNothing();
    console.log("✅ Sample search configs seeded");
  }

  console.log("🎉 Database seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
