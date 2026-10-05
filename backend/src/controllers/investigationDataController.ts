import { Response } from 'express';
import { dbClient } from '../database/dbClient.js';
import { AuthRequest } from '../middleware/auth.js';

export const getInvestigations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }

    const { role, id } = req.user;
    
    // Admins and Security Analysts can see all investigations if we wanted to build a dashboard,
    // but the prompt strictly states: 
    // "Do not give analysts unrestricted access to every user's raw private documents simply because they have an analyst role."
    // Let's implement strict ownership for now, unless they have SYSTEM_ADMIN role.
    
    let whereClause = {};
    if (role !== 'SYSTEM_ADMIN') {
      whereClause = { userId: id };
    }

    const investigations = await dbClient.investigation.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        riskAssessment: true,
        confidenceAssessment: true,
      }
    });

    res.status(200).json({ success: true, data: investigations });
  } catch (error) {
    console.error('getInvestigations error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

export const getInvestigationById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }

    const { id: investigationId } = req.params;
    const { role, id: userId } = req.user;

    const investigation = await dbClient.investigation.findUnique({
      where: { id: investigationId },
      include: {
        riskAssessment: true,
        confidenceAssessment: true,
        analysisResults: true,
        investigationEntities: { include: { entity: true } },
        evidence: true,
        inputs: true
      }
    });

    if (!investigation) {
      // Return 404 if not found
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Investigation not found' } });
      return;
    }

    // Horizontal Privilege Escalation Protection
    // Enforce ownership unless the user is a SYSTEM_ADMIN
    if (investigation.userId !== userId && role !== 'SYSTEM_ADMIN') {
      // Best practice: return 404 to avoid leaking the existence of another user's investigation
      await dbClient.auditLog.create({
        data: {
          action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          resourceType: 'Investigation',
          resourceId: investigationId,
          actorId: userId
        }
      });
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Investigation not found' } });
      return;
    }

    await dbClient.auditLog.create({
      data: {
        action: 'INVESTIGATION_ACCESSED',
        resourceType: 'Investigation',
        resourceId: investigationId,
        actorId: userId
      }
    });

    res.status(200).json({ success: true, data: investigation });
  } catch (error) {
    console.error('getInvestigationById error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};
