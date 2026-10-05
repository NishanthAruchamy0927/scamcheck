import { dbClient } from '../database/dbClient.js';
import { InvestigationReport, ExtractedOpportunity } from '../engine/types.js';
import { resolveEntity, extractDomainFromUrlOrEmail, EntityType } from '../engine/trust-graph/entityResolver.js';
import { CorrelationEngine } from '../engine/campaign-detection/correlationEngine.js';
import { PaymentSecurityService } from '../engine/payment/paymentSecurityService.js';

let warnedNoDatabase = false;

export async function persistInvestigationResult(
  title: string,
  inputMode: string,
  inputSnippet: string,
  report: InvestigationReport,
  entities: ExtractedOpportunity,
  userId?: string
): Promise<void> {
  // Database is optional: without it the analysis still works, only history/campaign features are off
  if (!process.env.DATABASE_URL) {
    if (!warnedNoDatabase) {
      console.warn('DATABASE_URL is not set: investigations are not persisted (campaign, graph and history APIs are disabled).');
      warnedNoDatabase = true;
    }
    return;
  }

  // Map input mode to Prisma InputType
  let mappedInputType: any = 'TEXT';
  const modeUpper = inputMode.toUpperCase();
  if (['TEXT', 'URL', 'IMAGE', 'SCREENSHOT', 'PDF', 'DOCX', 'EMAIL', 'AUDIO', 'QR'].includes(modeUpper)) {
    mappedInputType = modeUpper;
  }

  try {
    const resultInvId = await dbClient.$transaction(async (tx) => {
      // 1. Create Investigation
      const investigation = await tx.investigation.create({
        data: {
          title: title || 'Untitled Investigation',
          inputType: mappedInputType,
          status: 'COMPLETED',
          riskScore: report.riskScore,
          confidenceScore: report.confidenceScore,
          userId: userId || null
        }
      });

      // 2. Create Investigation Input
      await tx.investigationInput.create({
        data: {
          investigationId: investigation.id,
          type: mappedInputType,
          metadata: report.multimodal ? JSON.parse(JSON.stringify(report.multimodal)) : { originalLength: inputSnippet.length },
          source: 'user_submission'
        }
      });

      // 3. Create Risk Assessment
      await tx.riskAssessment.create({
        data: {
          investigationId: investigation.id,
          riskScore: report.riskScore,
          severity: report.riskLevel || 'UNKNOWN',
          methodology: 'HEURISTIC_V1'
        }
      });

      // 4. Create Confidence Assessment
      await tx.confidenceAssessment.create({
        data: {
          investigationId: investigation.id,
          confidenceScore: report.confidenceScore,
          evidenceCompleteness: 'UNKNOWN',
          confidenceMethod: 'HEURISTIC_V1'
        }
      });

      // 5. Create Analysis Result
      await tx.analysisResult.create({
        data: {
          investigationId: investigation.id,
          methodology: 'HEURISTIC_V1',
          findings: JSON.parse(JSON.stringify(report.signals))
        }
      });

      // 6. Save Entities using Phase 7 Resolution
      const rawEntities: { type: string; value: string; confidence?: number; source?: string }[] = [];
      const addRawEntity = (type: string, value: string) => {
        if (value && value !== 'Not detected') {
          rawEntities.push({ type, value });
        }
      };

      addRawEntity('ORGANIZATION', entities.organization);
      addRawEntity('RECRUITER', (entities as any).recruiterName || entities.recruiter);
      addRawEntity('EMAIL', (entities as any).contactEmail || entities.email || entities.recruiterEmail);
      addRawEntity('PHONE', (entities as any).contactPhone || entities.phone || entities.phoneNumber);
      addRawEntity('URL', (entities as any).jobUrl || entities.url || entities.opportunityUrl);

      if (report.multimodal && report.multimodal.content && report.multimodal.content.entities) {
        for (const e of report.multimodal.content.entities) {
          let dbType = 'OTHER';
          if (['ORGANIZATION', 'PERSON', 'RECRUITER', 'EMAIL', 'PHONE', 'DOMAIN', 'URL', 'UPI'].includes(e.type)) {
            dbType = e.type;
          } else if (['PAYMENT_REQUEST', 'ACCOUNT_NUMBER'].includes(e.type)) {
            dbType = 'PAYMENT_IDENTIFIER';
          }
          if (e.value) {
            rawEntities.push({ type: dbType, value: e.value, confidence: e.confidence, source: e.source });
          }
        }
      }

      for (const raw of rawEntities) {
        const canonical = resolveEntity(raw.type as EntityType, raw.value);
        
        // Upsert Entity
        const entity = await tx.entity.upsert({
          where: { fingerprint: canonical.fingerprint },
          update: {},
          create: {
            type: canonical.type as any,
            rawValue: canonical.rawValue,
            normalizedValue: canonical.normalizedValue,
            fingerprint: canonical.fingerprint,
            metadata: { confidence: raw.confidence, source: raw.source }
          }
        });

        // Link to Investigation
        await tx.investigationEntity.upsert({
          where: {
            investigationId_entityId: {
              investigationId: investigation.id,
              entityId: entity.id
            }
          },
          update: {},
          create: {
            investigationId: investigation.id,
            entityId: entity.id,
            confidence: raw.confidence
          }
        });

        // Create Domain Relationships if applicable
        const domain = extractDomainFromUrlOrEmail(canonical.type, canonical.normalizedValue);
        if (domain) {
          const domainCanonical = resolveEntity('DOMAIN', domain);
          const domainEntity = await tx.entity.upsert({
            where: { fingerprint: domainCanonical.fingerprint },
            update: {},
            create: {
              type: 'DOMAIN',
              rawValue: domain,
              normalizedValue: domainCanonical.normalizedValue,
              fingerprint: domainCanonical.fingerprint
            }
          });
          
          await tx.investigationEntity.upsert({
            where: {
              investigationId_entityId: {
                investigationId: investigation.id,
                entityId: domainEntity.id
              }
            },
            update: {},
            create: {
              investigationId: investigation.id,
              entityId: domainEntity.id
            }
          });

          // Create the Relationship
          const relationshipType = canonical.type === 'EMAIL' ? 'EMAIL_ON_DOMAIN' : 'URL_ON_DOMAIN';
          // Find if relationship exists
          const existingRel = await tx.entityRelationship.findFirst({
            where: {
              sourceEntityId: entity.id,
              targetEntityId: domainEntity.id,
              relationshipType: relationshipType
            }
          });

          if (!existingRel) {
            await tx.entityRelationship.create({
              data: {
                sourceEntityId: entity.id,
                targetEntityId: domainEntity.id,
                relationshipType: relationshipType,
                confidence: 'HIGH',
                source: 'EXACT_NORMALIZED_MATCH',
                evidence: 'Extracted from ' + canonical.type
              }
            });
          }
        }
      }

      // 7. Save Verification Result (Phase 6)
      if (report.verificationCenter) {
        const vr = await tx.verificationResult.create({
          data: {
            investigationId: investigation.id,
            trustScore: report.verificationCenter.trustScore,
            verificationConfidence: report.verificationCenter.verificationConfidence,
            metadata: { rationale: report.verificationCenter.trustRationale }
          }
        });
        
        const extCtx = report.verificationCenter.externalContext;
        if (extCtx) {
          const evidencePromises: any[] = [];
          
          if (extCtx.dns) {
            evidencePromises.push(tx.verificationEvidence.create({
              data: {
                verificationId: vr.id,
                provider: 'DNS',
                status: extCtx.dns.status,
                details: extCtx.dns as any
              }
            }));
          }
          if (extCtx.tls) {
            evidencePromises.push(tx.verificationEvidence.create({
              data: {
                verificationId: vr.id,
                provider: 'TLS',
                status: extCtx.tls.status,
                details: extCtx.tls as any
              }
            }));
          }
          if (extCtx.rdap) {
            evidencePromises.push(tx.verificationEvidence.create({
              data: {
                verificationId: vr.id,
                provider: 'RDAP',
                status: extCtx.rdap.status,
                details: extCtx.rdap as any
              }
            }));
          }
          if (extCtx.emailAuth) {
            evidencePromises.push(tx.verificationEvidence.create({
              data: {
                verificationId: vr.id,
                provider: 'EMAIL_AUTH',
                status: extCtx.emailAuth.spfStatus === 'SPF_PRESENT' ? 'VERIFIED' : 'UNAVAILABLE',
                details: extCtx.emailAuth as any
              }
            }));
          }
          
          if (evidencePromises.length > 0) {
            await Promise.all(evidencePromises);
          }
        }
      }

      // 8. Phase 8: Trigger Campaign Correlation (Asynchronous, outside transaction)
      // We pass the investigation ID to the engine. We can run this after the transaction commits.
      // But we are inside the transaction, so we'll just capture the ID and run it later.
      return investigation.id;
    });

    // Run Correlation Engine asynchronously
    if (resultInvId) {
      const engine = new CorrelationEngine();
      engine.correlateInvestigation(resultInvId).catch(err => {
        console.error('Correlation Engine failed:', err);
      });

      // Phase 9: Evaluate Payment Security for extracted entities
      const paymentEntities = await dbClient.investigationEntity.findMany({
        where: { investigationId: resultInvId },
        include: { entity: true }
      });
      const paymentSvc = new PaymentSecurityService();
      for (const ie of paymentEntities) {
        if (['UPI', 'UPI_URL', 'PAYMENT_URL', 'BANK_ACCOUNT', 'CRYPTO_ADDRESS', 'PHONE_PAYMENT_IDENTIFIER', 'QR_PAYLOAD'].includes(ie.entity.type)) {
          paymentSvc.evaluatePaymentDestination(ie.entity.id).catch(err => {
            console.error('Payment Security Service failed:', err);
          });
        }
      }
    }

  } catch (error) {
    console.error('Failed to persist investigation to database:', error);
    // We swallow the error so that the API response still works (backward compatibility requirement)
  }
}
