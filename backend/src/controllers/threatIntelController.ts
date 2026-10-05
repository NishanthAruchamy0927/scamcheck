import { Request, Response } from 'express';
import { dbClient } from '../database/dbClient.js';

export async function getThreatIntelDashboardHandler(req: Request, res: Response) {
  try {
    const totalIndicators = await dbClient.threatIndicator.count();
    const activeIndicators = await dbClient.threatIndicator.count({ where: { status: 'CONFIRMED' } });
    const candidates = await dbClient.scamCampaign.count({ where: { status: 'CANDIDATE' } });
    const confirmedCampaigns = await dbClient.scamCampaign.count({ where: { status: 'CONFIRMED' } });

    res.json({
      totalIndicators,
      activeIndicators,
      candidates,
      confirmedCampaigns
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getThreatIndicatorHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const indicator = await dbClient.threatIndicator.findUnique({
      where: { id },
      include: {
        entity: true,
        observations: {
          orderBy: { observedAt: 'desc' }
        }
      }
    });

    if (!indicator) return res.status(404).json({ error: 'Indicator not found' });
    res.json(indicator);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
