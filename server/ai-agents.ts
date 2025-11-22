import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, END } from "@langchain/langgraph";
import type { Claim, Provider } from "@shared/schema";

// Initialize Azure OpenAI
const azureOpenAI = new ChatOpenAI({
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_ENDPOINT?.split("//")[1]?.split(".")[0] || "",
  azureOpenAIApiDeploymentName: "gpt-4",
  azureOpenAIApiVersion: "2024-02-15-preview",
  temperature: 0.3,
});

// State interface for LangGraph workflow
interface FraudAnalysisState {
  claim?: Claim;
  provider?: Provider;
  claims?: Claim[];
  
  // Validator results
  validationIssues: string[];
  isValid: boolean;
  
  // Anomaly detector results
  anomalies: string[];
  severity: string;
  
  // Pattern analyzer results
  pathway: "operational" | "fraud" | "uncertain";
  operationalHypothesis: string;
  fraudHypothesis: string;
  
  // Risk scorer results
  riskScore: number;
  riskLevel: "critical" | "high" | "medium" | "low";
  confidence: number;
  evidence: string[];
  recommendation: string;
}

// Claim Validator Agent Node
async function claimValidatorNode(state: FraudAnalysisState): Promise<Partial<FraudAnalysisState>> {
  const claim = state.claim;
  if (!claim) {
    return { validationIssues: ["No claim provided"], isValid: false };
  }
  
  const issues: string[] = [];
  
  // Basic validation
  if (!claim.cptCode || !claim.billedAmount) {
    issues.push("Missing required fields");
  }
  
  if (claim.sessionDuration && claim.documentedDuration) {
    if (claim.sessionDuration > claim.documentedDuration * 1.5) {
      issues.push("Session duration significantly exceeds documented duration");
    }
  }
  
  if (Number(claim.billedAmount) <= 0) {
    issues.push("Invalid billing amount");
  }
  
  // Check for duplicate billing indicators
  if (claim.caseNotes?.includes("Brief session") && Number(claim.billedAmount) > 150) {
    issues.push("Brief session with high billing amount");
  }
  
  return {
    validationIssues: issues,
    isValid: issues.length === 0,
  };
}

// Anomaly Detector Agent Node
async function anomalyDetectorNode(state: FraudAnalysisState): Promise<Partial<FraudAnalysisState>> {
  const claim = state.claim;
  if (!claim) {
    return { anomalies: [], severity: "low" };
  }
  
  const anomalies: string[] = [];
  let severity = "low";
  
  // Check for upcoding
  if (claim.sessionDuration && claim.documentedDuration) {
    const discrepancy = claim.sessionDuration - claim.documentedDuration;
    if (discrepancy > 15) {
      anomalies.push(`Duration discrepancy: ${discrepancy} minutes (possible upcoding)`);
      severity = "high";
    } else if (discrepancy > 5) {
      anomalies.push(`Minor duration discrepancy: ${discrepancy} minutes`);
      severity = severity === "high" ? "high" : "medium";
    }
  }
  
  // Check for weekend/after-hours billing
  const serviceDate = new Date(claim.serviceDate);
  const day = serviceDate.getDay();
  const hour = serviceDate.getHours();
  
  if (day === 0 || day === 6) {
    anomalies.push("Weekend billing detected");
    severity = severity === "high" ? "high" : "medium";
  }
  
  if (hour < 6 || hour > 22) {
    anomalies.push("After-hours billing detected (outside 6 AM - 10 PM)");
    severity = severity === "high" ? "high" : "medium";
  }
  
  // Add validation issues as anomalies
  if (state.validationIssues.length > 0) {
    anomalies.push(...state.validationIssues);
    severity = "high";
  }
  
  // Check for high billing amounts
  const billedAmount = Number(claim.billedAmount);
  if (billedAmount > 500) {
    anomalies.push(`Unusually high billing amount: $${billedAmount}`);
    severity = "high";
  }
  
  return {
    anomalies,
    severity,
  };
}

// Pattern Analyzer Agent Node (uses LLM for dual-pathway reasoning)
async function patternAnalyzerNode(state: FraudAnalysisState): Promise<Partial<FraudAnalysisState>> {
  const claim = state.claim;
  if (!claim || state.anomalies.length === 0) {
    return {
      pathway: "operational",
      operationalHypothesis: "No significant anomalies detected. Claim appears legitimate.",
      fraudHypothesis: "No fraud indicators present.",
    };
  }
  
  try {
    const prompt = `You are an AI fraud detection specialist for healthcare payers. Analyze the following medical claim with a DUAL-PATHWAY approach.

CLAIM DETAILS:
- CPT Code: ${claim.cptCode} (${claim.cptDescription})
- Billed Amount: $${claim.billedAmount}
- Service Date: ${claim.serviceDate}
- Session Duration: ${claim.sessionDuration || "N/A"} minutes
- Documented Duration: ${claim.documentedDuration || "N/A"} minutes
- Submitted Date: ${claim.submittedDate}
- Case Notes: ${claim.caseNotes || "None provided"}

DETECTED ANOMALIES (Severity: ${state.severity}):
${state.anomalies.map((a, i) => `${i + 1}. ${a}`).join("\n")}

DUAL-PATHWAY ANALYSIS REQUIRED:
Analyze from BOTH perspectives:

1. OPERATIONAL PATHWAY - Innocent explanations:
   - Technical/system errors
   - Billing software glitches
   - Human data entry mistakes
   - Valid clinical scenarios that appear unusual
   - Documentation delays or discrepancies

2. FRAUD PATHWAY - Intentional abuse indicators:
   - Systematic overbilling patterns
   - Deliberate upcoding
   - Phantom billing
   - Service manipulation
   - Coordinated fraudulent activity

Respond in this EXACT format:
PATHWAY: [operational/fraud/uncertain]
OPERATIONAL_HYPOTHESIS: [150 char max explanation of innocent scenario]
FRAUD_HYPOTHESIS: [150 char max explanation of fraud scenario]`;

    const response = await azureOpenAI.invoke(prompt);
    const content = response.content.toString();
    
    // Parse the response
    const pathwayMatch = content.match(/PATHWAY:\s*(operational|fraud|uncertain)/i);
    const opMatch = content.match(/OPERATIONAL_HYPOTHESIS:\s*(.+?)(?=FRAUD_HYPOTHESIS:|$)/s);
    const fraudMatch = content.match(/FRAUD_HYPOTHESIS:\s*(.+?)$/s);
    
    const pathway = (pathwayMatch?.[1]?.toLowerCase() as "operational" | "fraud" | "uncertain") || "uncertain";
    const operationalHypothesis = opMatch?.[1]?.trim().substring(0, 200) || "Unknown operational scenario";
    const fraudHypothesis = fraudMatch?.[1]?.trim().substring(0, 200) || "Unknown fraud scenario";
    
    return {
      pathway,
      operationalHypothesis,
      fraudHypothesis,
    };
  } catch (error) {
    console.error("Pattern analyzer error:", error);
    return {
      pathway: "uncertain",
      operationalHypothesis: "Unable to analyze - system error",
      fraudHypothesis: "Unable to analyze - system error",
    };
  }
}

// Risk Scorer Agent Node (uses LLM for final assessment)
async function riskScorerNode(state: FraudAnalysisState): Promise<Partial<FraudAnalysisState>> {
  const claim = state.claim;
  if (!claim) {
    return {
      riskScore: 0,
      riskLevel: "low",
      confidence: 0,
      evidence: [],
      recommendation: "No claim to score",
    };
  }
  
  try {
    const prompt = `You are a risk assessment AI for healthcare fraud detection. Calculate a final risk score and provide recommendations.

PATHWAY DETERMINATION: ${state.pathway}
OPERATIONAL EXPLANATION: ${state.operationalHypothesis}
FRAUD EXPLANATION: ${state.fraudHypothesis}

ANOMALIES DETECTED:
${state.anomalies.map((a, i) => `${i + 1}. ${a}`).join("\n")}

SEVERITY LEVEL: ${state.severity}

Calculate:
1. Risk Score (0-100, where 0 = no risk, 100 = definite fraud)
2. Risk Level (low/medium/high/critical)
3. Confidence (0-1, how certain are you?)
4. Key Evidence (3-5 bullet points)
5. Recommendation (approve/manual_review/deny)

Consider:
- If pathway is "operational", score should be lower (0-40)
- If pathway is "fraud", score should be higher (60-100)
- If pathway is "uncertain", score should be moderate (40-70)
- Severity affects the score significantly

Respond in this EXACT format:
RISK_SCORE: [0-100]
RISK_LEVEL: [low/medium/high/critical]
CONFIDENCE: [0.0-1.0]
EVIDENCE: [bullet 1]|[bullet 2]|[bullet 3]
RECOMMENDATION: [approve/manual_review/deny]`;

    const response = await azureOpenAI.invoke(prompt);
    const content = response.content.toString();
    
    // Parse response
    const scoreMatch = content.match(/RISK_SCORE:\s*(\d+)/i);
    const levelMatch = content.match(/RISK_LEVEL:\s*(low|medium|high|critical)/i);
    const confMatch = content.match(/CONFIDENCE:\s*([0-9.]+)/i);
    const evidenceMatch = content.match(/EVIDENCE:\s*(.+?)(?=RECOMMENDATION:|$)/s);
    const recMatch = content.match(/RECOMMENDATION:\s*(approve|manual_review|deny)/i);
    
    const riskScore = parseInt(scoreMatch?.[1] || "50");
    const riskLevel = (levelMatch?.[1]?.toLowerCase() as "low" | "medium" | "high" | "critical") || "medium";
    const confidence = parseFloat(confMatch?.[1] || "0.5");
    const evidence = evidenceMatch?.[1]
      ?.split("|")
      ?.map(e => e.trim())
      ?.filter(e => e.length > 0) || state.anomalies.slice(0, 5);
    const recommendation = recMatch?.[1] || "manual_review";
    
    return {
      riskScore,
      riskLevel,
      confidence,
      evidence,
      recommendation,
    };
  } catch (error) {
    console.error("Risk scorer error:", error);
    // Fallback scoring based on severity
    let riskScore = 30;
    let riskLevel: "low" | "medium" | "high" | "critical" = "low";
    
    if (state.severity === "high") {
      riskScore = 75;
      riskLevel = "high";
    } else if (state.severity === "medium") {
      riskScore = 50;
      riskLevel = "medium";
    }
    
    if (state.pathway === "fraud") {
      riskScore = Math.min(95, riskScore + 20);
      riskLevel = riskScore > 80 ? "critical" : "high";
    }
    
    return {
      riskScore,
      riskLevel,
      confidence: 0.6,
      evidence: state.anomalies.slice(0, 5),
      recommendation: riskScore > 70 ? "manual_review" : "approve",
    };
  }
}

// Build the LangGraph workflow
function buildFraudDetectionGraph() {
  const workflow = new StateGraph<FraudAnalysisState>({
    channels: {
      claim: null,
      provider: null,
      claims: null,
      validationIssues: null,
      isValid: null,
      anomalies: null,
      severity: null,
      pathway: null,
      operationalHypothesis: null,
      fraudHypothesis: null,
      riskScore: null,
      riskLevel: null,
      confidence: null,
      evidence: null,
      recommendation: null,
    },
  });
  
  // Add nodes to the graph
  workflow.addNode("validator", claimValidatorNode);
  workflow.addNode("anomalyDetector", anomalyDetectorNode);
  workflow.addNode("patternAnalyzer", patternAnalyzerNode);
  workflow.addNode("riskScorer", riskScorerNode);
  
  // Define the workflow edges
  workflow.setEntryPoint("validator");
  workflow.addEdge("validator", "anomalyDetector");
  workflow.addEdge("anomalyDetector", "patternAnalyzer");
  workflow.addEdge("patternAnalyzer", "riskScorer");
  workflow.addEdge("riskScorer", END);
  
  return workflow.compile();
}

// Compile the graph once
const fraudDetectionGraph = buildFraudDetectionGraph();

// Public API for claim analysis
export async function analyzeClaim(claim: Claim) {
  const initialState: FraudAnalysisState = {
    claim,
    validationIssues: [],
    isValid: true,
    anomalies: [],
    severity: "low",
    pathway: "operational",
    operationalHypothesis: "",
    fraudHypothesis: "",
    riskScore: 0,
    riskLevel: "low",
    confidence: 0,
    evidence: [],
    recommendation: "approve",
  };
  
  try {
    const result = await fraudDetectionGraph.invoke(initialState);
    
    return {
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      pathway: result.pathway,
      operationalHypothesis: result.operationalHypothesis,
      fraudHypothesis: result.fraudHypothesis,
      confidence: result.confidence,
      evidence: result.evidence,
      recommendation: result.recommendation,
      anomalies: result.anomalies,
    };
  } catch (error) {
    console.error("Fraud detection graph error:", error);
    throw error;
  }
}

// Public API for provider analysis
export async function analyzeProvider(provider: Provider, claims: Claim[]) {
  // For provider analysis, we'll analyze multiple claims and aggregate results
  if (claims.length === 0) {
    return {
      riskScore: 0,
      riskLevel: "low" as const,
      pathway: "operational" as const,
      operationalHypothesis: "No claims to analyze",
      fraudHypothesis: "No claims to analyze",
      confidence: 0,
      evidence: [],
      recommendation: "No action needed",
      claimAnalyses: [],
    };
  }
  
  // Analyze a sample of claims (up to 10)
  const sampleClaims = claims.slice(0, Math.min(10, claims.length));
  const analyses = await Promise.all(
    sampleClaims.map(claim => analyzeClaim(claim))
  );
  
  // Aggregate results
  const avgRiskScore = Math.round(
    analyses.reduce((sum, a) => sum + a.riskScore, 0) / analyses.length
  );
  const highRiskCount = analyses.filter(a => a.riskLevel === "high" || a.riskLevel === "critical").length;
  const fraudPathwayCount = analyses.filter(a => a.pathway === "fraud").length;
  
  let riskLevel: "low" | "medium" | "high" | "critical" = "low";
  if (avgRiskScore > 80 || highRiskCount > 5) {
    riskLevel = "critical";
  } else if (avgRiskScore > 60 || highRiskCount > 3) {
    riskLevel = "high";
  } else if (avgRiskScore > 40 || highRiskCount > 1) {
    riskLevel = "medium";
  }
  
  const pathway = fraudPathwayCount > sampleClaims.length / 2 ? "fraud" : "operational";
  
  return {
    riskScore: avgRiskScore,
    riskLevel,
    pathway,
    operationalHypothesis: `Provider has ${claims.length} claims with average risk score ${avgRiskScore}. Patterns suggest ${pathway === "operational" ? "legitimate practice" : "potential systematic fraud"}.`,
    fraudHypothesis: `${highRiskCount} of ${sampleClaims.length} analyzed claims show high risk. ${fraudPathwayCount} claims flagged as likely fraud.`,
    confidence: Math.min(0.95, 0.5 + (sampleClaims.length / 20)),
    evidence: [
      `Total claims: ${claims.length}`,
      `High-risk claims: ${highRiskCount}/${sampleClaims.length} analyzed`,
      `Average risk score: ${avgRiskScore}/100`,
      `Fraud pathway detections: ${fraudPathwayCount}`,
    ],
    recommendation: riskLevel === "critical" || riskLevel === "high" ? "manual_review" : "monitor",
    claimAnalyses: analyses,
  };
}
