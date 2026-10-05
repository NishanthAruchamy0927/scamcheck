import { Request, Response } from 'express';
import { getEntityIntelligence, getInvestigationGraph } from '../services/graphService.js';

export async function getEntityIntelligenceHandler(req: Request, res: Response) {
  try {
    const { entityId } = req.params;
    // Assuming auth middleware sets user
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role || 'USER';

    const result = await getEntityIntelligence(entityId, userId, userRole);
    if (!result) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getInvestigationGraphHandler(req: Request, res: Response) {
  try {
    const { investigationId } = req.params;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role || 'USER';

    const result = await getInvestigationGraph(investigationId, userId, userRole);
    if (!result) {
      return res.status(404).json({ error: 'Investigation not found' });
    }

    res.json(result);
  } catch (err: any) {
    if (err.message.includes('Unauthorized')) {
      return res.status(403).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
}
