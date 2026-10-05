import { Request, Response } from 'express';
import { dbClient } from '../database/dbClient.js';
import { PaymentSecurityService } from '../engine/payment/paymentSecurityService.js';

export async function getPaymentAssessmentHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const entity = await dbClient.entity.findUnique({
      where: { id },
      include: {
        paymentAssessment: true
      }
    });

    if (!entity) return res.status(404).json({ error: 'Payment entity not found' });

    // If no assessment exists, generate one on the fly (for retrocompatibility)
    if (!entity.paymentAssessment) {
      const paymentSvc = new PaymentSecurityService();
      const evaluation = await paymentSvc.evaluatePaymentDestination(entity.id);
      return res.json({ entity, assessment: evaluation?.assessment, details: evaluation });
    }

    res.json({ entity, assessment: entity.paymentAssessment });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getRelatedInvestigationsHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role || 'USER';

    const entity = await dbClient.entity.findUnique({
      where: { id },
      include: {
        investigations: {
          include: { investigation: true }
        }
      }
    });

    if (!entity) return res.status(404).json({ error: 'Payment entity not found' });

    let investigations = entity.investigations;

    // RBAC: Normal users only see their own investigations
    if (userRole !== 'SECURITY_ANALYST' && userRole !== 'SYSTEM_ADMIN') {
      investigations = investigations.filter(ci => 
        !ci.investigation.userId || ci.investigation.userId === userId
      );
    }

    res.json(investigations);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function reportPaymentHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { reason, investigationId } = req.body;
    const userId = (req as any).user?.id;

    let assessment = await dbClient.paymentAssessment.findUnique({
      where: { entityId: id }
    });

    if (!assessment) {
      const paymentSvc = new PaymentSecurityService();
      const evalResult = await paymentSvc.evaluatePaymentDestination(id);
      if (!evalResult) return res.status(404).json({ error: 'Could not create assessment for entity' });
      assessment = evalResult.assessment;
    }

    const report = await dbClient.paymentReport.create({
      data: {
        assessmentId: assessment!.id,
        reporterId: userId || null,
        investigationId: investigationId || null,
        reason,
        status: 'USER_REPORTED'
      }
    });

    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
