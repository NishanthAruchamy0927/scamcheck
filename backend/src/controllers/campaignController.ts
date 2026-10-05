import { Request, Response } from 'express';
import { dbClient } from '../database/dbClient.js';

export async function getCampaignsHandler(req: Request, res: Response) {
  try {
    const campaigns = await dbClient.scamCampaign.findMany({
      orderBy: { lastSeenAt: 'desc' },
      include: {
        _count: {
          select: { investigations: true, entities: true }
        }
      }
    });
    res.json(campaigns);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getCampaignDetailsHandler(req: Request, res: Response) {
  try {
    const { campaignId } = req.params;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role || 'USER';

    const campaign = await dbClient.scamCampaign.findUnique({
      where: { id: campaignId },
      include: {
        investigations: {
          include: {
            investigation: true
          }
        },
        entities: {
          include: {
            entity: true
          }
        }
      }
    });

    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    // RBAC: Filter investigations so normal users don't see cross-tenant private data
    if (userRole !== 'SECURITY_ANALYST' && userRole !== 'SYSTEM_ADMIN') {
      campaign.investigations = campaign.investigations.filter(ci => 
        !ci.investigation.userId || ci.investigation.userId === userId
      );
    }

    // Add Timeline for Phase 8 Hardening
    const timeline = campaign.investigations.map(ci => ({
      event: 'Investigation Correlated',
      timestamp: ci.createdAt,
      details: ci.reason
    })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    res.json({ ...campaign, timeline });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function reviewCampaignHandler(req: Request, res: Response) {
  try {
    const { campaignId } = req.params;
    const { decision, reason } = req.body; // CONFIRMED, REJECTED, UNRESOLVED
    const userRole = (req as any).user?.role || 'USER';
    const userId = (req as any).user?.id || 'UNKNOWN';

    if (userRole !== 'SECURITY_ANALYST' && userRole !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: 'Only security analysts can review campaigns' });
    }

    if (!['CONFIRMED', 'REJECTED', 'UNRESOLVED'].includes(decision)) {
      return res.status(400).json({ error: 'Invalid decision' });
    }

    const campaign = await dbClient.scamCampaign.update({
      where: { id: campaignId },
      data: { status: decision }
    });

    // Create Audit Log
    await dbClient.auditLog.create({
      data: {
        actorId: userId !== 'UNKNOWN' ? userId : null,
        action: `CAMPAIGN_${decision}`,
        resourceType: 'ScamCampaign',
        resourceId: campaignId,
        metadata: { reason }
      }
    });

    res.json(campaign);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
