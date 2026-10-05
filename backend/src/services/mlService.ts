import axios from 'axios';


export interface MLAnalysisResult {
  available: boolean;
  model?: string;
  version?: string;
  score?: number;
  confidence?: number;
  reason?: string;
}

export async function analyzeWithML(text: string, deterministicRisk: number): Promise<MLAnalysisResult> {
  try {
    const response = await axios.post(`${process.env.ML_SERVICE_URL || 'http://localhost:8000'}/api/ai/analyze`, {
      text,
      deterministic_risk: deterministicRisk
    }, {
      timeout: 3000 // 3 seconds timeout to prevent hanging the main investigation
    });

    const classification = response.data?.classification;
    const model = response.data?.model;
    if (
      classification &&
      typeof classification.score === 'number' &&
      model &&
      typeof model.name === 'string' &&
      typeof model.version === 'string'
    ) {
      const score = Math.max(0, Math.min(1, classification.score)) * 100;
      return {
        available: true,
        model: model.name,
        version: model.version,
        score,
        confidence: Math.max(score, 100 - score)
      };
    }

    return {
      available: false,
      reason: 'INVALID_RESPONSE'
    };
  } catch (error: any) {
    if (error.response && error.response.status === 503) {
      return { available: false, reason: 'MODEL_NOT_READY' };
    }
    return {
      available: false,
      reason: error.code === 'ECONNABORTED' ? 'TIMEOUT' : 'SERVICE_UNAVAILABLE'
    };
  }
}
