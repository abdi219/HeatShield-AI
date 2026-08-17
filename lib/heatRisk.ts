import { HeatRiskAssessment, HeatRiskLevel } from "@/types";

interface CalculateHRSOptions {
  surfaceTempC: number;
  ambientTempC: number;
  canopyCoveragePct?: number;
  albedoFactor?: number;
}

/**
 * Deterministic Heat Risk Score (HRS) Mathematical Model
 * 
 * Formula:
 * HRS = clamp(0, 100, w1 * T_norm + w2 * Delta_T_anomaly + w3 * Impervious_Penalty - w4 * Shade_Credit)
 * 
 * Where:
 * - T_norm: Normalized surface heat from 20°C to 50°C (0 to 100)
 * - Delta_T_anomaly: Surface heat excess above ambient baseline (thermal retention penalty)
 * - Impervious_Penalty: Surface albedo absorption factor
 * - Shade_Credit: Tree canopy and structural shade factor
 */
export function calculateHeatRiskScore(options: CalculateHRSOptions): HeatRiskAssessment {
  const { surfaceTempC, ambientTempC, canopyCoveragePct = 15, albedoFactor = 0.15 } = options;

  // 1. Normalized Surface Temperature (Scale: 20°C = 0, 50°C = 100)
  const tNorm = Math.max(0, Math.min(100, ((surfaceTempC - 20) / 30) * 100));

  // 2. Anomaly Penalty (Excess above ambient baseline)
  const deltaAnomaly = Math.max(0, surfaceTempC - ambientTempC);
  const anomalyPenalty = Math.min(100, deltaAnomaly * 10.0);

  // 3. Impervious Surface Albedo Penalty (Dark asphalt albedo ~0.10 has high penalty)
  const surfaceAlbedoPenalty = Math.max(0, Math.min(100, (0.50 - albedoFactor) * 160));

  // 4. Canopy Deficit & Shade Credit
  const vegetationDeficitPenalty = Math.max(0, 100 - canopyCoveragePct);
  const shadeCredit = Math.min(100, canopyCoveragePct * 1.2);

  // Weighted Aggregation (Weights: 0.45, 0.25, 0.15, 0.15)
  const rawScore = 
    (tNorm * 0.45) + 
    (anomalyPenalty * 0.25) + 
    (surfaceAlbedoPenalty * 0.15) + 
    (vegetationDeficitPenalty * 0.15) - 
    (shadeCredit * 0.10);

  const finalScore = Math.round(Math.max(0, Math.min(100, rawScore)));

  // Risk Classification
  let level: HeatRiskLevel = 'low';
  if (finalScore > 80) level = 'extreme';
  else if (finalScore > 60) level = 'high';
  else if (finalScore > 30) level = 'moderate';

  // Actionable Recommendations
  const recommendations: string[] = [];
  if (deltaAnomaly > 5.0) {
    recommendations.push("High thermal mass retention detected from unshaded asphalt.");
  }
  if (canopyCoveragePct < 20) {
    recommendations.push("Severe tree canopy deficit. Seeking shade or tensile cover recommended.");
  } else {
    recommendations.push("Corridor benefits from moderate urban canopy cooling.");
  }
  if (finalScore > 75) {
    recommendations.push("Heat hazard elevated. Consider cool routing alternatives.");
  } else {
    recommendations.push("Thermal exposure within manageable pedestrian thresholds.");
  }

  return {
    score: finalScore,
    level,
    surfaceTemp: Number(surfaceTempC.toFixed(1)),
    ambientTemp: Number(ambientTempC.toFixed(1)),
    deltaAnomaly: Number(deltaAnomaly.toFixed(1)),
    contributingFactors: {
      surfaceAlbedoPenalty: Math.round(surfaceAlbedoPenalty),
      vegetationDeficitPenalty: Math.round(vegetationDeficitPenalty),
      solarExposurePenalty: Math.round(tNorm * 0.3),
      shadeCredit: Math.round(shadeCredit),
    },
    recommendations,
  };
}
