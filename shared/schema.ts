import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, decimal, boolean, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const riskLevelEnum = pgEnum("risk_level", ["critical", "high", "medium", "low"]);
export const fwaTypeEnum = pgEnum("fwa_type", [
  "duplicate_billing",
  "underbilling",
  "upcoding",
  "billed_not_visited",
  "service_overlap",
  "missed_visit",
  "outlier_intensity",
  "code_switching",
  "afterhours_spike",
  "overutilization"
]);
export const alertStatusEnum = pgEnum("alert_status", ["active", "investigating", "resolved", "dismissed"]);
export const pathwayEnum = pgEnum("pathway", ["operational", "fraud", "uncertain"]);

// Providers Table
export const providers = pgTable("providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  npi: varchar("npi", { length: 10 }).notNull().unique(),
  name: text("name").notNull(),
  specialty: text("specialty").notNull(),
  networkStatus: text("network_status").notNull().default("active"),
  yearsActive: integer("years_active").notNull().default(0),
  totalClaims: integer("total_claims").notNull().default(0),
  avgClaimAmount: decimal("avg_claim_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  riskScore: integer("risk_score").notNull().default(0),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: varchar("zip_code", { length: 10 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Members Table
export const members = pgTable("members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id", { length: 20 }).notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: timestamp("date_of_birth").notNull(),
  policyId: text("policy_id").notNull(),
  diagnosisCodes: text("diagnosis_codes").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Claims Table
export const claims = pgTable("claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id", { length: 30 }).notNull().unique(),
  providerId: varchar("provider_id").notNull().references(() => providers.id),
  memberId: varchar("member_id").notNull().references(() => members.id),
  serviceDate: timestamp("service_date").notNull(),
  submittedDate: timestamp("submitted_date").notNull(),
  cptCode: varchar("cpt_code", { length: 10 }).notNull(),
  cptDescription: text("cpt_description").notNull(),
  modifiers: text("modifiers").array(),
  billedAmount: decimal("billed_amount", { precision: 10, scale: 2 }).notNull(),
  authorizedUnits: integer("authorized_units").notNull().default(1),
  billedUnits: integer("billed_units").notNull().default(1),
  sessionDuration: integer("session_duration"),
  documentedDuration: integer("documented_duration"),
  caseNotes: text("case_notes"),
  approved: boolean("approved").default(false),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// EVV Data Table (Electronic Visit Verification)
export const evvRecords = pgTable("evv_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id").references(() => claims.id),
  providerId: varchar("provider_id").notNull().references(() => providers.id),
  memberId: varchar("member_id").notNull().references(() => members.id),
  scheduledDate: timestamp("scheduled_date").notNull(),
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  gpsLatitude: decimal("gps_latitude", { precision: 10, scale: 7 }),
  gpsLongitude: decimal("gps_longitude", { precision: 10, scale: 7 }),
  memberAddressLat: decimal("member_address_lat", { precision: 10, scale: 7 }),
  memberAddressLng: decimal("member_address_lng", { precision: 10, scale: 7 }),
  deviceId: text("device_id"),
  syncStatus: text("sync_status").notNull().default("synced"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Clinical Outcomes Table
export const clinicalOutcomes = pgTable("clinical_outcomes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull().references(() => members.id),
  providerId: varchar("provider_id").notNull().references(() => providers.id),
  assessmentDate: timestamp("assessment_date").notNull(),
  phq9Score: integer("phq9_score"),
  previousPhq9Score: integer("previous_phq9_score"),
  sessionCount: integer("session_count").notNull().default(0),
  assessmentType: text("assessment_type").notNull(),
  improvementTrend: text("improvement_trend"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Fraud Alerts Table
export const fraudAlerts = pgTable("fraud_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").references(() => providers.id),
  memberId: varchar("member_id").references(() => members.id),
  claimId: varchar("claim_id").references(() => claims.id),
  alertType: fwaTypeEnum("alert_type").notNull(),
  riskLevel: riskLevelEnum("risk_level").notNull(),
  riskScore: integer("risk_score").notNull(),
  pathway: pathwayEnum("pathway").notNull(),
  aiReasoning: jsonb("ai_reasoning").notNull(),
  detectedAt: timestamp("detected_at").notNull().defaultNow(),
  status: alertStatusEnum("status").notNull().default("active"),
  investigatorNotes: text("investigator_notes"),
  resolvedAt: timestamp("resolved_at"),
});

// Provider Statistics (aggregated view)
export const providerStats = pgTable("provider_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").notNull().references(() => providers.id),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  totalClaims: integer("total_claims").notNull().default(0),
  totalBilled: decimal("total_billed", { precision: 12, scale: 2 }).notNull().default("0"),
  avgClaimAmount: decimal("avg_claim_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  weekendClaims: integer("weekend_claims").notNull().default(0),
  afterHoursClaims: integer("after_hours_claims").notNull().default(0),
  duplicateClaimCount: integer("duplicate_claim_count").notNull().default(0),
  highRiskAlerts: integer("high_risk_alerts").notNull().default(0),
  peerGroupAvg: decimal("peer_group_avg", { precision: 10, scale: 2 }),
  standardDeviation: decimal("standard_deviation", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const providersRelations = relations(providers, ({ many }) => ({
  claims: many(claims),
  evvRecords: many(evvRecords),
  fraudAlerts: many(fraudAlerts),
  stats: many(providerStats),
  clinicalOutcomes: many(clinicalOutcomes),
}));

export const membersRelations = relations(members, ({ many }) => ({
  claims: many(claims),
  evvRecords: many(evvRecords),
  fraudAlerts: many(fraudAlerts),
  clinicalOutcomes: many(clinicalOutcomes),
}));

export const claimsRelations = relations(claims, ({ one, many }) => ({
  provider: one(providers, {
    fields: [claims.providerId],
    references: [providers.id],
  }),
  member: one(members, {
    fields: [claims.memberId],
    references: [members.id],
  }),
  evvRecord: one(evvRecords),
  fraudAlerts: many(fraudAlerts),
}));

export const evvRecordsRelations = relations(evvRecords, ({ one }) => ({
  claim: one(claims, {
    fields: [evvRecords.claimId],
    references: [claims.id],
  }),
  provider: one(providers, {
    fields: [evvRecords.providerId],
    references: [providers.id],
  }),
  member: one(members, {
    fields: [evvRecords.memberId],
    references: [members.id],
  }),
}));

export const fraudAlertsRelations = relations(fraudAlerts, ({ one }) => ({
  provider: one(providers, {
    fields: [fraudAlerts.providerId],
    references: [providers.id],
  }),
  member: one(members, {
    fields: [fraudAlerts.memberId],
    references: [members.id],
  }),
  claim: one(claims, {
    fields: [fraudAlerts.claimId],
    references: [claims.id],
  }),
}));

export const clinicalOutcomesRelations = relations(clinicalOutcomes, ({ one }) => ({
  member: one(members, {
    fields: [clinicalOutcomes.memberId],
    references: [members.id],
  }),
  provider: one(providers, {
    fields: [clinicalOutcomes.providerId],
    references: [providers.id],
  }),
}));

export const providerStatsRelations = relations(providerStats, ({ one }) => ({
  provider: one(providers, {
    fields: [providerStats.providerId],
    references: [providers.id],
  }),
}));

// Insert Schemas
export const insertProviderSchema = createInsertSchema(providers).omit({ id: true, createdAt: true });
export const insertMemberSchema = createInsertSchema(members).omit({ id: true, createdAt: true });
export const insertClaimSchema = createInsertSchema(claims).omit({ id: true, createdAt: true });
export const insertEvvRecordSchema = createInsertSchema(evvRecords).omit({ id: true, createdAt: true });
export const insertClinicalOutcomeSchema = createInsertSchema(clinicalOutcomes).omit({ id: true, createdAt: true });
export const insertFraudAlertSchema = createInsertSchema(fraudAlerts).omit({ id: true, createdAt: true });
export const insertProviderStatsSchema = createInsertSchema(providerStats).omit({ id: true, createdAt: true });

// Types
export type Provider = typeof providers.$inferSelect;
export type InsertProvider = z.infer<typeof insertProviderSchema>;
export type Member = typeof members.$inferSelect;
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Claim = typeof claims.$inferSelect;
export type InsertClaim = z.infer<typeof insertClaimSchema>;
export type EvvRecord = typeof evvRecords.$inferSelect;
export type InsertEvvRecord = z.infer<typeof insertEvvRecordSchema>;
export type ClinicalOutcome = typeof clinicalOutcomes.$inferSelect;
export type InsertClinicalOutcome = z.infer<typeof insertClinicalOutcomeSchema>;
export type FraudAlert = typeof fraudAlerts.$inferSelect;
export type InsertFraudAlert = z.infer<typeof insertFraudAlertSchema>;
export type ProviderStats = typeof providerStats.$inferSelect;
export type InsertProviderStats = z.infer<typeof insertProviderStatsSchema>;

// Dashboard Response Types
export type DashboardMetrics = {
  totalFwaDetected: number;
  totalAmount: number;
  recoveryRate: number;
  activeInvestigations: number;
  highRiskClaims: number;
  detectionTrend: { date: string; count: number; amount: number }[];
  categoryBreakdown: { category: string; count: number; percentage: number }[];
  topRiskProviders: (Provider & { alertCount: number })[];
};

export type ClaimWithRelations = Claim & {
  provider: Provider;
  member: Member;
  evvRecord?: EvvRecord;
  fraudAlerts: FraudAlert[];
};

export type ProviderWithStats = Provider & {
  stats?: ProviderStats;
  recentAlerts: FraudAlert[];
  claimCount: number;
};
