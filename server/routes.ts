import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, DatabaseStorage } from "./storage";
import { db } from "./db";
import { generateSyntheticData } from "./data-generator";
import { analyzeClaim, analyzeProvider } from "./ai-agents";
import { providers, members, claims, evvRecords, clinicalOutcomes, fraudAlerts } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard endpoints
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
  });

  app.get("/api/dashboard/recent-alerts", async (req, res) => {
    try {
      const alerts = await storage.getFraudAlerts(10);
      const alertsWithProviders = await Promise.all(
        alerts.map(async (alert) => {
          const provider = alert.providerId ? await storage.getProvider(alert.providerId) : null;
          return {
            ...alert,
            providerName: provider?.name || "Unknown Provider",
            message: `${alert.alertType.replace(/_/g, " ")} detected - Risk score: ${alert.riskScore}`,
          };
        })
      );
      res.json(alertsWithProviders);
    } catch (error) {
      console.error("Error fetching recent alerts:", error);
      res.status(500).json({ error: "Failed to fetch recent alerts" });
    }
  });

  // Claim Anomaly Detection endpoints
  app.get("/api/claim-anomaly/duplicate-billing", async (req, res) => {
    try {
      const alerts = await storage.getFraudAlerts(1000);
      const duplicateAlerts = alerts.filter(a => a.alertType === "duplicate_billing");
      
      const cases = await Promise.all(
        duplicateAlerts.slice(0, 50).map(async (alert) => {
          const provider = alert.providerId ? await storage.getProvider(alert.providerId) : null;
          const member = alert.memberId ? await storage.getMember(alert.memberId) : null;
          const claim = alert.claimId ? await storage.getClaim(alert.claimId) : null;
          
          return {
            id: alert.id,
            claimId: claim?.claimId || "N/A",
            providerName: provider?.name || "Unknown",
            memberName: member ? `${member.firstName} ${member.lastName}` : "Unknown",
            serviceDate: claim?.serviceDate || new Date(),
            cptCode: claim?.cptCode || "N/A",
            modifiers: claim?.modifiers || [],
            amount: claim?.billedAmount || "0",
            riskScore: alert.riskScore,
            pathway: alert.pathway,
          };
        })
      );
      
      res.json({
        totalCount: duplicateAlerts.length,
        totalAmount: duplicateAlerts.reduce((sum, a) => sum + a.riskScore * 100, 0),
        operationalCount: duplicateAlerts.filter(a => a.pathway === "operational").length,
        fraudCount: duplicateAlerts.filter(a => a.pathway === "fraud").length,
        cases,
      });
    } catch (error) {
      console.error("Error fetching duplicate billing data:", error);
      res.status(500).json({ error: "Failed to fetch duplicate billing data" });
    }
  });

  app.get("/api/claim-anomaly/underbilling", async (req, res) => {
    try {
      const underbildingAlerts = await storage.getFraudAlertsByType("underbilling");
      
      const cases = await Promise.all(
        underbildingAlerts.slice(0, 50).map(async (alert) => {
          const provider = alert.providerId ? await storage.getProvider(alert.providerId) : null;
          const member = alert.memberId ? await storage.getMember(alert.memberId) : null;
          const claim = alert.claimId ? await storage.getClaim(alert.claimId) : null;
          
          return {
            id: alert.id,
            claimId: claim?.claimId || "N/A",
            providerName: provider?.name || "Unknown",
            memberName: member ? `${member.firstName} ${member.lastName}` : "Unknown",
            serviceDate: claim?.serviceDate || new Date(),
            cptCode: claim?.cptCode || "N/A",
            modifiers: claim?.modifiers || [],
            amount: claim?.billedAmount || "0",
            expectedAmount: Number(claim?.billedAmount || 0) * 1.3,
            riskScore: alert.riskScore,
            pathway: alert.pathway,
          };
        })
      );
      
      res.json({
        totalLeakage: underbildingAlerts.reduce((sum, a) => sum + a.riskScore * 50, 0),
        totalCount: underbildingAlerts.length,
        cases,
      });
    } catch (error) {
      console.error("Error fetching underbilling data:", error);
      res.status(500).json({ error: "Failed to fetch underbilling data" });
    }
  });

  app.get("/api/claim-anomaly/upcoding", async (req, res) => {
    try {
      const upcodingAlerts = await storage.getFraudAlertsByType("upcoding");
      
      const cases = await Promise.all(
        upcodingAlerts.slice(0, 50).map(async (alert) => {
          const provider = alert.providerId ? await storage.getProvider(alert.providerId) : null;
          const member = alert.memberId ? await storage.getMember(alert.memberId) : null;
          const claim = alert.claimId ? await storage.getClaim(alert.claimId) : null;
          
          return {
            id: alert.id,
            claimId: claim?.claimId || "N/A",
            providerName: provider?.name || "Unknown",
            memberName: member ? `${member.firstName} ${member.lastName}` : "Unknown",
            serviceDate: claim?.serviceDate || new Date(),
            cptCode: claim?.cptCode || "N/A",
            modifiers: claim?.modifiers || [],
            amount: claim?.billedAmount || "0",
            expectedCode: Math.random() < 0.5 ? "90832" : "90834",
            riskScore: alert.riskScore,
            pathway: alert.pathway,
          };
        })
      );
      
      res.json({
        totalOverpayment: upcodingAlerts.reduce((sum, a) => sum + a.riskScore * 75, 0),
        totalCount: upcodingAlerts.length,
        cases,
      });
    } catch (error) {
      console.error("Error fetching upcoding data:", error);
      res.status(500).json({ error: "Failed to fetch upcoding data" });
    }
  });

  // EVV Intelligence endpoints
  app.get("/api/evv/not-visited", async (req, res) => {
    try {
      const evvAlerts = await storage.getFraudAlertsByType("billed_not_visited");
      
      const cases = await Promise.all(
        evvAlerts.slice(0, 50).map(async (alert) => {
          const provider = alert.providerId ? await storage.getProvider(alert.providerId) : null;
          const member = alert.memberId ? await storage.getMember(alert.memberId) : null;
          const claim = alert.claimId ? await storage.getClaim(alert.claimId) : null;
          
          return {
            id: alert.id,
            claimId: claim?.claimId || "N/A",
            providerName: provider?.name || "Unknown",
            memberName: member ? `${member.firstName} ${member.lastName}` : "Unknown",
            serviceDate: claim?.serviceDate || new Date(),
            evvStatus: Math.random() < 0.5 ? "missing" : "mismatch",
            distance: Math.floor(Math.random() * 15),
            riskScore: alert.riskScore,
            pathway: alert.pathway,
          };
        })
      );
      
      res.json({
        totalCount: evvAlerts.length,
        totalAmount: evvAlerts.reduce((sum, a) => sum + a.riskScore * 120, 0),
        cases,
      });
    } catch (error) {
      console.error("Error fetching EVV data:", error);
      res.status(500).json({ error: "Failed to fetch EVV data" });
    }
  });

  app.get("/api/evv/service-overlap", async (req, res) => {
    try {
      const overlapAlerts = await storage.getFraudAlertsByType("service_overlap");
      
      const cases = await Promise.all(
        overlapAlerts.slice(0, 50).map(async (alert) => {
          const provider = alert.providerId ? await storage.getProvider(alert.providerId) : null;
          const member = alert.memberId ? await storage.getMember(alert.memberId) : null;
          const claim = alert.claimId ? await storage.getClaim(alert.claimId) : null;
          
          return {
            id: alert.id,
            claimId: claim?.claimId || "N/A",
            providerName: provider?.name || "Unknown",
            memberName: member ? `${member.firstName} ${member.lastName}` : "Unknown",
            serviceDate: claim?.serviceDate || new Date(),
            evvStatus: "overlap",
            distance: 0,
            riskScore: alert.riskScore,
            pathway: alert.pathway,
          };
        })
      );
      
      res.json({
        totalCount: overlapAlerts.length,
        cases,
      });
    } catch (error) {
      console.error("Error fetching service overlap data:", error);
      res.status(500).json({ error: "Failed to fetch service overlap data" });
    }
  });

  app.get("/api/evv/missed-visits", async (req, res) => {
    try {
      const missedAlerts = await storage.getFraudAlertsByType("missed_visit");
      
      const cases = await Promise.all(
        missedAlerts.slice(0, 50).map(async (alert) => {
          const provider = alert.providerId ? await storage.getProvider(alert.providerId) : null;
          const member = alert.memberId ? await storage.getMember(alert.memberId) : null;
          const claim = alert.claimId ? await storage.getClaim(alert.claimId) : null;
          
          return {
            id: alert.id,
            claimId: claim?.claimId || "N/A",
            providerName: provider?.name || "Unknown",
            memberName: member ? `${member.firstName} ${member.lastName}` : "Unknown",
            serviceDate: claim?.serviceDate || new Date(),
            evvStatus: "missed",
            distance: 0,
            riskScore: alert.riskScore,
            pathway: alert.pathway,
          };
        })
      );
      
      res.json({
        totalCount: missedAlerts.length,
        cases,
      });
    } catch (error) {
      console.error("Error fetching missed visits data:", error);
      res.status(500).json({ error: "Failed to fetch missed visits data" });
    }
  });

  // Provider Profiling endpoints
  app.get("/api/providers/risk-analysis", async (req, res) => {
    try {
      const providers = await storage.getProvidersWithStats();
      res.json(providers);
    } catch (error) {
      console.error("Error fetching provider risk analysis:", error);
      res.status(500).json({ error: "Failed to fetch provider risk analysis" });
    }
  });

  app.get("/api/providers/outliers", async (req, res) => {
    try {
      const alerts = await storage.getFraudAlerts(1000);
      
      res.json({
        intensityCount: alerts.filter(a => a.alertType === "outlier_intensity").length,
        codeSwitchCount: alerts.filter(a => a.alertType === "code_switching").length,
        afterHoursCount: alerts.filter(a => a.alertType === "afterhours_spike").length,
      });
    } catch (error) {
      console.error("Error fetching provider outliers:", error);
      res.status(500).json({ error: "Failed to fetch provider outliers" });
    }
  });

  app.get("/api/provider/:id", async (req, res) => {
    try {
      const provider = await storage.getProvider(req.params.id);
      if (!provider) {
        return res.status(404).json({ error: "Provider not found" });
      }
      
      const claims = await storage.getClaimsByProvider(req.params.id);
      const alerts = await storage.getFraudAlertsByProvider(req.params.id);
      const stats = await storage.getProviderStatsByProvider(req.params.id);
      
      res.json({
        ...provider,
        claims,
        alerts,
        stats,
      });
    } catch (error) {
      console.error("Error fetching provider details:", error);
      res.status(500).json({ error: "Failed to fetch provider details" });
    }
  });

  // Benefit Utilization endpoints
  app.get("/api/benefit-utilization/overutilization", async (req, res) => {
    try {
      const overutilizationAlerts = await storage.getFraudAlertsByType("overutilization");
      
      const cases = await Promise.all(
        overutilizationAlerts.slice(0, 50).map(async (alert) => {
          const provider = alert.providerId ? await storage.getProvider(alert.providerId) : null;
          const member = alert.memberId ? await storage.getMember(alert.memberId) : null;
          
          return {
            id: alert.id,
            memberName: member ? `${member.firstName} ${member.lastName}` : "Unknown",
            providerName: provider?.name || "Unknown",
            sessionCount: Math.floor(Math.random() * 20) + 15,
            initialPhq9: Math.floor(Math.random() * 12) + 12,
            currentPhq9: Math.floor(Math.random() * 12) + 10,
            change: Math.floor(Math.random() * 5) - 2,
            riskScore: alert.riskScore,
            pathway: alert.pathway,
          };
        })
      );
      
      res.json({
        totalCases: overutilizationAlerts.length,
        avgPhq9Change: -1.2,
        avgSessions: 22,
        cases,
      });
    } catch (error) {
      console.error("Error fetching benefit utilization data:", error);
      res.status(500).json({ error: "Failed to fetch benefit utilization data" });
    }
  });

  // Reports endpoints
  app.get("/api/reports/stats", async (req, res) => {
    try {
      const alerts = await storage.getFraudAlerts(1000);
      
      res.json({
        totalCases: alerts.length,
        totalAmount: alerts.reduce((sum, a) => sum + a.riskScore * 100, 0),
        resolvedCases: alerts.filter(a => a.status === "resolved").length,
        resolutionRate: Math.round((alerts.filter(a => a.status === "resolved").length / alerts.length) * 100) || 0,
        recovered: alerts.filter(a => a.status === "resolved").reduce((sum, a) => sum + a.riskScore * 50, 0),
      });
    } catch (error) {
      console.error("Error fetching report stats:", error);
      res.status(500).json({ error: "Failed to fetch report stats" });
    }
  });

  // Data generation endpoint (for initial setup)
  app.post("/api/admin/generate-data", async (req, res) => {
    try {
      // First clear existing data if using database storage
      if (storage instanceof DatabaseStorage) {
        console.log("🗑️  Clearing existing data...");
        await db.delete(fraudAlerts);
        await db.delete(clinicalOutcomes);
        await db.delete(evvRecords);
        await db.delete(claims);
        await db.delete(members);
        await db.delete(providers);
        console.log("✓ Existing data cleared");
      }
      
      const result = await generateSyntheticData();
      res.json({
        success: true,
        message: "Synthetic data generated successfully",
        ...result,
      });
    } catch (error) {
      console.error("Error generating synthetic data:", error);
      res.status(500).json({ error: "Failed to generate synthetic data" });
    }
  });

  // AI Analysis endpoints
  app.post("/api/ai/analyze-claim", async (req, res) => {
    try {
      const { claimId } = req.body;
      const claim = await storage.getClaim(claimId);
      
      if (!claim) {
        return res.status(404).json({ error: "Claim not found" });
      }
      
      const analysis = await analyzeClaim(claim);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing claim:", error);
      res.status(500).json({ error: "Failed to analyze claim" });
    }
  });

  app.post("/api/ai/analyze-provider", async (req, res) => {
    try {
      const { providerId } = req.body;
      const provider = await storage.getProvider(providerId);
      
      if (!provider) {
        return res.status(404).json({ error: "Provider not found" });
      }
      
      const claims = await storage.getClaimsByProvider(providerId);
      const analysis = await analyzeProvider(provider, claims);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing provider:", error);
      res.status(500).json({ error: "Failed to analyze provider" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
