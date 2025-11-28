import { storage } from "./storage";
import type {
  InsertProvider,
  InsertMember,
  InsertClaim,
  InsertEvvRecord,
  InsertClinicalOutcome,
  InsertFraudAlert,
} from "@shared/schema";
import { v4 as uuidv4 } from "uuid";

// Helper functions
const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomElement = <T>(arr: T[]): T => arr[random(0, arr.length - 1)];
const randomDate = (start: Date, end: Date) =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// Generate realistic fraud alert status based on audit pipeline workflow
// ~60% active (not yet investigated), ~25% investigating, ~12% resolved, ~3% dismissed
const getRandomAlertStatus = (): "active" | "investigating" | "resolved" | "dismissed" => {
  const rand = Math.random();
  if (rand < 0.60) return "active";
  if (rand < 0.85) return "investigating";
  if (rand < 0.97) return "resolved";
  return "dismissed";
};

// Healthcare data
const specialties = [
  "Behavioral Health",
  "Clinical Psychology",
  "Licensed Clinical Social Worker",
  "Mental Health Counselor",
  "Psychiatric Nurse Practitioner",
  "Home Health Aide",
  "Physical Therapist",
  "Occupational Therapist",
];

const cities = [
  { city: "Los Angeles", state: "CA", lat: 34.0522, lng: -118.2437 },
  { city: "New York", state: "NY", lat: 40.7128, lng: -74.0060 },
  { city: "Chicago", state: "IL", lat: 41.8781, lng: -87.6298 },
  { city: "Houston", state: "TX", lat: 29.7604, lng: -95.3698 },
  { city: "Phoenix", state: "AZ", lat: 33.4484, lng: -112.0740 },
  { city: "Philadelphia", state: "PA", lat: 39.9526, lng: -75.1652 },
  { city: "Miami", state: "FL", lat: 25.7617, lng: -80.1918 },
];

const cptCodes = [
  { code: "90832", description: "Psychotherapy 30 min", duration: 30, avgCost: 95 },
  { code: "90834", description: "Psychotherapy 45 min", duration: 45, avgCost: 140 },
  { code: "90837", description: "Psychotherapy 60 min", duration: 60, avgCost: 180 },
  { code: "90791", description: "Psychiatric diagnostic evaluation", duration: 60, avgCost: 200 },
  { code: "97110", description: "Therapeutic exercises", duration: 15, avgCost: 50 },
  { code: "97530", description: "Therapeutic activities", duration: 15, avgCost: 55 },
  { code: "G0151", description: "Home health services", duration: 60, avgCost: 120 },
];

const modifiers = ["95", "59", "GT", "GC"];

const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"];

// Generate providers
function generateProviders(count: number): InsertProvider[] {
  const providers: InsertProvider[] = [];
  
  for (let i = 0; i < count; i++) {
    const location = randomElement(cities);
    const specialty = randomElement(specialties);
    const isHighRisk = Math.random() < 0.15; // 15% are high risk
    
    providers.push({
      npi: String(1000000000 + i).padStart(10, '0'),
      name: `Dr. ${randomElement(firstNames)} ${randomElement(lastNames)}`,
      specialty,
      networkStatus: Math.random() < 0.95 ? "active" : "suspended",
      yearsActive: random(1, 25),
      totalClaims: isHighRisk ? random(800, 2000) : random(100, 500),
      avgClaimAmount: isHighRisk ? String(random(200, 400)) : String(random(120, 180)),
      riskScore: isHighRisk ? random(70, 95) : random(10, 40),
      address: `${random(100, 9999)} ${randomElement(["Main", "Oak", "Pine", "Maple", "Cedar"])} St`,
      city: location.city,
      state: location.state,
      zipCode: String(random(10000, 99999)),
    });
  }
  
  return providers;
}

// Generate members
function generateMembers(count: number): InsertMember[] {
  const members: InsertMember[] = [];
  
  for (let i = 0; i < count; i++) {
    const dob = randomDate(new Date(1940, 0, 1), new Date(2010, 11, 31));
    
    members.push({
      memberId: `MEM${String(100000 + i).padStart(6, '0')}`,
      firstName: randomElement(firstNames),
      lastName: randomElement(lastNames),
      dateOfBirth: dob,
      policyId: `POL-${random(1000, 9999)}-${random(100, 999)}`,
      diagnosisCodes: [
        randomElement(["F33.1", "F41.1", "F32.9", "F43.10", "F90.0"]),
      ],
    });
  }
  
  return members;
}

// Generate claims with FWA patterns
function generateClaims(
  providers: any[],
  members: any[],
  count: number
): { claims: InsertClaim[]; evvRecords: InsertEvvRecord[]; clinicalOutcomes: InsertClinicalOutcome[] } {
  const claims: InsertClaim[] = [];
  const evvRecords: InsertEvvRecord[] = [];
  const clinicalOutcomes: InsertClinicalOutcome[] = [];
  let lastClaim: InsertClaim | null = null;
  
  for (let i = 0; i < count; i++) {
    const provider = randomElement(providers);
    const member = randomElement(members);
    const cpt = randomElement(cptCodes);
    const serviceDate = randomDate(new Date(2024, 0, 1), new Date(2024, 11, 31));
    const submittedDate = new Date(serviceDate.getTime() + random(1, 7) * 86400000);
    
    const isHighRisk = provider.riskScore > 70;
    const isFraud = isHighRisk && Math.random() < 0.3;
    
    // Duplicate billing pattern - actually create duplicates
    const isDuplicate = isFraud && lastClaim && Math.random() < 0.15;
    
    // Upcoding pattern (billed more than documented)
    const isUpcoded = isFraud && Math.random() < 0.25;
    
    // Underbilling pattern (documented more than billed) - 5% of claims
    const isUnderbilled = Math.random() < 0.05;
    
    // Calculate actual documented duration based on patterns
    let actualDuration: number;
    if (isUpcoded) {
      actualDuration = Math.floor(cpt.duration * 0.5); // Documented less than billed
    } else if (isUnderbilled) {
      actualDuration = Math.floor(cpt.duration * 1.5); // Documented more than billed (revenue leakage)
    } else {
      actualDuration = cpt.duration; // Documented matches billed
    }
    
    // Weekend/after-hours pattern
    const isWeekend = isFraud && Math.random() < 0.15;
    if (isWeekend) {
      serviceDate.setDate(serviceDate.getDate() + (6 - serviceDate.getDay()));
    }
    
    // Create duplicate claim if needed
    let claim: InsertClaim;
    if (isDuplicate && lastClaim) {
      // Create a duplicate of the last claim with a new claim ID
      claim = {
        ...lastClaim,
        claimId: `CLM-2024-${String(100000 + i).padStart(6, '0')}`,
        submittedDate: new Date(lastClaim.submittedDate.getTime() + random(1, 3) * 86400000),
      };
    } else {
      claim = {
        claimId: `CLM-2024-${String(100000 + i).padStart(6, '0')}`,
        providerId: provider.id,
        memberId: member.id,
        serviceDate,
        submittedDate,
        cptCode: cpt.code,
        cptDescription: cpt.description,
        modifiers: Math.random() < 0.3 ? [randomElement(modifiers)] : [],
        billedAmount: String(cpt.avgCost + random(-20, 20)),
        authorizedUnits: 1,
        billedUnits: 1,
        sessionDuration: cpt.duration,
        documentedDuration: actualDuration,
        caseNotes: `Session conducted with member. ${isUpcoded ? "Brief session." : "Standard therapy session."}`,
        approved: !isFraud || Math.random() < 0.5,
        paidAmount: !isFraud ? String(cpt.avgCost) : null,
      };
    }
    
    claims.push(claim);
    lastClaim = claim;
    
    // Generate EVV record
    if (cpt.code === "G0151" || Math.random() < 0.5) {
      const location = cities.find(c => c.city === provider.city) || cities[0];
      const hasGpsMismatch = isFraud && Math.random() < 0.3;
      const hasNoCheckIn = isFraud && Math.random() < 0.2;
      
      evvRecords.push({
        providerId: provider.id,
        memberId: member.id,
        scheduledDate: serviceDate,
        checkInTime: hasNoCheckIn ? null : new Date(serviceDate.getTime() + random(0, 3600000)),
        checkOutTime: hasNoCheckIn ? null : new Date(serviceDate.getTime() + cpt.duration * 60000),
        gpsLatitude: hasGpsMismatch ? String(location.lat + random(-10, 10)) : String(location.lat + random(-1, 1) * 0.01),
        gpsLongitude: hasGpsMismatch ? String(location.lng + random(-10, 10)) : String(location.lng + random(-1, 1) * 0.01),
        memberAddressLat: String(location.lat),
        memberAddressLng: String(location.lng),
        deviceId: `DEV-${random(1000, 9999)}`,
        syncStatus: hasNoCheckIn ? "failed" : "synced",
      });
    }
    
    // Generate clinical outcomes
    if (cpt.code.startsWith("90") && Math.random() < 0.1) {
      const isOverutilized = isFraud && Math.random() < 0.3;
      const initialScore = random(12, 24);
      const improvement = isOverutilized ? random(-2, 2) : random(-8, -2);
      
      clinicalOutcomes.push({
        memberId: member.id,
        providerId: provider.id,
        assessmentDate: serviceDate,
        phq9Score: initialScore + improvement,
        previousPhq9Score: initialScore,
        sessionCount: random(10, 30),
        assessmentType: "PHQ-9",
        improvementTrend: improvement < -3 ? "improving" : "flat",
      });
    }
  }
  
  return { claims, evvRecords, clinicalOutcomes };
}

// Generate fraud alerts using AI-style reasoning
function generateFraudAlerts(
  claims: any[],
  providers: any[],
  members: any[]
): InsertFraudAlert[] {
  const alerts: InsertFraudAlert[] = [];
  
  // Analyze claims for fraud patterns
  const claimsByProvider = new Map<string, any[]>();
  claims.forEach(claim => {
    const existing = claimsByProvider.get(claim.providerId) || [];
    existing.push(claim);
    claimsByProvider.set(claim.providerId, existing);
  });
  
  claimsByProvider.forEach((providerClaims, providerId) => {
    const provider = providers.find(p => p.id === providerId);
    if (!provider) return;
    
    // Detect duplicate billing
    const duplicateGroups = new Map<string, any[]>();
    providerClaims.forEach(claim => {
      const key = `${claim.memberId}-${claim.serviceDate}-${claim.cptCode}`;
      const group = duplicateGroups.get(key) || [];
      group.push(claim);
      duplicateGroups.set(key, group);
    });
    
    duplicateGroups.forEach((group, key) => {
      if (group.length > 1) {
        const claim = group[0];
        const isOperational = Math.random() < 0.6;
        
        alerts.push({
          providerId,
          memberId: claim.memberId,
          claimId: claim.id,
          alertType: "duplicate_billing",
          riskLevel: isOperational ? "medium" : "high",
          riskScore: isOperational ? random(50, 65) : random(75, 90),
          pathway: isOperational ? "operational" : "fraud",
          aiReasoning: {
            operationalHypothesis: "EHR system timeout may have triggered automatic resubmission",
            fraudHypothesis: "Systematic pattern of duplicate claims across multiple members detected",
            confidence: isOperational ? 0.7 : 0.85,
            evidence: [
              `${group.length} duplicate claims for same service date`,
              isOperational ? "Single instance, likely technical error" : "Repeated pattern across multiple days",
            ],
          },
          status: getRandomAlertStatus(),
        });
      }
    });
    
    // Detect upcoding
    providerClaims.forEach(claim => {
      if (claim.documentedDuration && claim.sessionDuration > claim.documentedDuration * 1.5) {
        alerts.push({
          providerId,
          memberId: claim.memberId,
          claimId: claim.id,
          alertType: "upcoding",
          riskLevel: "high",
          riskScore: random(75, 92),
          pathway: "fraud",
          aiReasoning: {
            operationalHypothesis: "Incorrect CPT code mapping in billing system",
            fraudHypothesis: "Consistent pattern of billing 60-min sessions with 30-min documentation",
            confidence: 0.88,
            evidence: [
              `Documented duration: ${claim.documentedDuration} min`,
              `Billed duration: ${claim.sessionDuration} min`,
              `Pattern observed across ${random(5, 15)} similar claims`,
            ],
          },
          status: getRandomAlertStatus(),
        });
      }
    });
    
    // Detect underbilling (revenue leakage - documented work exceeds billed)
    let underbillingCount = 0;
    let eligibleCount = 0;
    providerClaims.forEach(claim => {
      if (claim.documentedDuration && claim.documentedDuration > claim.sessionDuration * 1.3) {
        eligibleCount++;
        if (Math.random() < 0.5) {
          underbillingCount++;
          const missedRevenue = (claim.documentedDuration - claim.sessionDuration) * 3.5;
          alerts.push({
            providerId,
            memberId: claim.memberId,
            claimId: claim.id,
            alertType: "underbilling",
            riskLevel: "low",
            riskScore: random(40, 60),
            pathway: "operational",
            aiReasoning: {
              operationalHypothesis: "Billing system defaulting to lower CPT code tier",
              fraudHypothesis: "Revenue leakage opportunity - provider eligible for higher reimbursement",
              confidence: 0.75,
              evidence: [
                `Documented duration: ${claim.documentedDuration} min`,
                `Billed duration: ${claim.sessionDuration} min`,
                `Potential revenue missed: $${Math.round(missedRevenue)}`,
              ],
            },
            status: getRandomAlertStatus(),
          });
        }
      }
    });
    if (eligibleCount > 0) {
      console.log(`Provider ${providerId}: ${eligibleCount} eligible underbilling claims, created ${underbillingCount} alerts`);
    }
    
    // Detect billing intensity outliers (top ~10% of providers by volume)
    if (providerClaims.length > 110 && Math.random() < 0.5) {
      alerts.push({
        providerId,
        alertType: "outlier_intensity",
        riskLevel: "medium",
        riskScore: random(60, 75),
        pathway: "uncertain",
        aiReasoning: {
          operationalHypothesis: "Provider serves higher-acuity patient population",
          fraudHypothesis: "Billing volume 3.2 SD above peer group average",
          confidence: 0.65,
          evidence: [
            `Total claims: ${providerClaims.length}`,
            `Peer group average: ${random(85, 105)}`,
            "Statistical outlier detected",
          ],
        },
        status: getRandomAlertStatus(),
      });
    }
    
    // Detect code switching patterns
    const cptCodes = new Set(providerClaims.map(c => c.cptCode));
    if (cptCodes.size > 5 && Math.random() < 0.4) {
      alerts.push({
        providerId,
        alertType: "code_switching",
        riskLevel: "medium",
        riskScore: random(65, 80),
        pathway: Math.random() < 0.5 ? "operational" : "fraud",
        aiReasoning: {
          operationalHypothesis: "Provider diversified service offering to meet patient needs",
          fraudHypothesis: "Frequent CPT code changes to maximize reimbursement rates",
          confidence: 0.72,
          evidence: [
            `${cptCodes.size} different CPT codes used`,
            "Pattern suggests optimization for higher-paying codes",
            "Inconsistent with typical practice patterns",
          ],
        },
        status: getRandomAlertStatus(),
      });
    }
    
    // Detect after-hours billing spikes
    const afterHoursClaims = providerClaims.filter(c => {
      const hour = new Date(c.serviceDate).getHours();
      const day = new Date(c.serviceDate).getDay();
      return hour < 7 || hour > 19 || day === 0 || day === 6;
    });
    if (afterHoursClaims.length > providerClaims.length * 0.3 && Math.random() < 0.35) {
      alerts.push({
        providerId,
        alertType: "afterhours_spike",
        riskLevel: "medium",
        riskScore: random(58, 73),
        pathway: "operational",
        aiReasoning: {
          operationalHypothesis: "Provider offers extended hours to accommodate working patients",
          fraudHypothesis: "Suspicious pattern of weekend/after-hours billing inconsistent with practice type",
          confidence: 0.68,
          evidence: [
            `${afterHoursClaims.length} claims (${Math.round(afterHoursClaims.length / providerClaims.length * 100)}%) outside normal business hours`,
            "Concentration on weekends and late evenings",
            "Pattern differs from peer group norms",
          ],
        },
        status: getRandomAlertStatus(),
      });
    }
  });
  
  // Generate EVV-related fraud alerts
  // Sample 10% of claims to check for EVV issues
  const sampleSize = Math.floor(claims.length * 0.1);
  for (let i = 0; i < sampleSize; i++) {
    const claim = claims[random(0, claims.length - 1)];
    
    // Randomly generate EVV fraud patterns
    if (Math.random() < 0.05) {
      // Billed but not visited
      alerts.push({
        providerId: claim.providerId,
        memberId: claim.memberId,
        claimId: claim.id,
        alertType: "billed_not_visited",
        riskLevel: Math.random() < 0.6 ? "high" : "critical",
        riskScore: random(70, 95),
        pathway: Math.random() < 0.4 ? "operational" : "fraud",
        aiReasoning: {
          operationalHypothesis: "EVV device malfunction or connectivity issue prevented GPS logging",
          fraudHypothesis: "Service billed without corresponding EVV verification, systematic pattern detected",
          confidence: 0.82,
          evidence: [
            "No EVV check-in/check-out recorded",
            "GPS coordinates missing or failed validation",
            "Pattern observed across multiple service dates",
          ],
        },
        status: getRandomAlertStatus(),
      });
    }
    
    if (Math.random() < 0.03) {
      // Service overlap
      alerts.push({
        providerId: claim.providerId,
        memberId: claim.memberId,
        claimId: claim.id,
        alertType: "service_overlap",
        riskLevel: "high",
        riskScore: random(75, 88),
        pathway: "fraud",
        aiReasoning: {
          operationalHypothesis: "Scheduling error or data entry mistake in billing system",
          fraudHypothesis: "Provider claiming simultaneous services for multiple members - physically impossible",
          confidence: 0.91,
          evidence: [
            "Multiple overlapping service times detected",
            "Provider cannot be in two locations simultaneously",
            "Repeated pattern across multiple days",
          ],
        },
        status: getRandomAlertStatus(),
      });
    }
    
    if (Math.random() < 0.04) {
      // Missed visit
      alerts.push({
        providerId: claim.providerId,
        memberId: claim.memberId,
        claimId: claim.id,
        alertType: "missed_visit",
        riskLevel: "medium",
        riskScore: random(55, 70),
        pathway: "operational",
        aiReasoning: {
          operationalHypothesis: "Legitimate cancellation not properly documented in billing system",
          fraudHypothesis: "Pattern of billing for scheduled-but-not-rendered services",
          confidence: 0.68,
          evidence: [
            "No EVV check-in recorded for scheduled service",
            "Member did not acknowledge service receipt",
            "Possible documentation gap",
          ],
        },
        status: getRandomAlertStatus(),
      });
    }
    
    if (Math.random() < 0.025) {
      // Overutilization without outcome improvement
      alerts.push({
        providerId: claim.providerId,
        memberId: claim.memberId,
        claimId: claim.id,
        alertType: "overutilization",
        riskLevel: random(0, 10) < 7 ? "medium" : "high",
        riskScore: random(60, 85),
        pathway: Math.random() < 0.6 ? "operational" : "fraud",
        aiReasoning: {
          operationalHypothesis: "Member has treatment-resistant condition requiring extended intervention",
          fraudHypothesis: "Provider maximizing sessions without regard to clinical necessity or improvement",
          confidence: 0.72,
          evidence: [
            "High session count (20+ sessions) with minimal clinical improvement",
            "PHQ-9 scores remain elevated or show minimal change",
            "Sessions continue despite lack of demonstrated progress",
          ],
        },
        status: getRandomAlertStatus(),
      });
    }
  }
  
  return alerts;
}

// Main generation function
export async function generateSyntheticData() {
  console.log("🚀 Starting synthetic healthcare data generation...");
  
  try {
    // Generate providers
    console.log("📊 Generating providers...");
    const providerData = generateProviders(500);
    const providers = await storage.bulkInsertProviders(providerData);
    console.log(`✓ Created ${providers.length} providers`);
    
    // Generate members
    console.log("👥 Generating members...");
    const memberData = generateMembers(5000);
    const members = await storage.bulkInsertMembers(memberData);
    console.log(`✓ Created ${members.length} members`);
    
    // Generate claims, EVV records, and clinical outcomes in batches
    console.log("💼 Generating claims and related data...");
    const { claims: claimData, evvRecords: evvData, clinicalOutcomes: outcomeData } =
      generateClaims(providers, members, 50000);
    
    // Insert claims in batches of 500
    console.log("💾 Inserting claims in batches...");
    const claims: any[] = [];
    const batchSize = 500;
    for (let i = 0; i < claimData.length; i += batchSize) {
      const batch = claimData.slice(i, i + batchSize);
      const inserted = await storage.bulkInsertClaims(batch);
      claims.push(...inserted);
      console.log(`  Inserted ${claims.length}/${claimData.length} claims...`);
    }
    console.log(`✓ Created ${claims.length} claims`);
    
    // Insert EVV records in batches
    console.log("📍 Inserting EVV records in batches...");
    const evvRecords: any[] = [];
    for (let i = 0; i < evvData.length; i += batchSize) {
      const batch = evvData.slice(i, i + batchSize);
      const inserted = await storage.bulkInsertEvvRecords(batch);
      evvRecords.push(...inserted);
    }
    console.log(`✓ Created ${evvRecords.length} EVV records`);
    
    // Insert clinical outcomes in batches
    console.log("📊 Inserting clinical outcomes in batches...");
    const outcomes: any[] = [];
    for (let i = 0; i < outcomeData.length; i += batchSize) {
      const batch = outcomeData.slice(i, i + batchSize);
      const inserted = await storage.bulkInsertClinicalOutcomes(batch);
      outcomes.push(...inserted);
    }
    console.log(`✓ Created ${outcomes.length} clinical outcomes`);
    
    // Generate fraud alerts
    console.log("🚨 Analyzing claims for fraud patterns...");
    const alertData = generateFraudAlerts(claims, providers, members);
    const alerts = await storage.bulkInsertFraudAlerts(alertData);
    console.log(`✓ Generated ${alerts.length} fraud alerts`);
    
    console.log("✅ Synthetic data generation complete!");
    console.log(`📈 Summary:
      - Providers: ${providers.length}
      - Members: ${members.length}
      - Claims: ${claims.length}
      - EVV Records: ${evvRecords.length}
      - Clinical Outcomes: ${outcomes.length}
      - Fraud Alerts: ${alerts.length}
    `);
    
    return {
      providers: providers.length,
      members: members.length,
      claims: claims.length,
      evvRecords: evvRecords.length,
      clinicalOutcomes: outcomes.length,
      fraudAlerts: alerts.length,
    };
  } catch (error) {
    console.error("❌ Error generating synthetic data:", error);
    throw error;
  }
}

// Allow running directly: `npx tsx server/data-generator.ts`
const scriptPath = process.argv[1] || "";
const isDirectRun =
  scriptPath.endsWith("data-generator.ts") || scriptPath.endsWith("data-generator.js");

if (isDirectRun) {
  generateSyntheticData()
    .then(() => {
      console.log("✅ Done.");
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
