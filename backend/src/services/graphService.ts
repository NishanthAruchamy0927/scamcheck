import { dbClient } from '../database/dbClient.js';

export async function getEntityIntelligence(entityId: string, userId: string | undefined, userRole: string = 'USER') {
  // 1. Fetch the requested entity
  const entity = await dbClient.entity.findUnique({
    where: { id: entityId },
    include: {
      sourceRelations: {
        include: { targetEntity: true }
      },
      targetRelations: {
        include: { sourceEntity: true }
      }
    }
  });

  if (!entity) {
    return null;
  }

  // 2. Fetch all investigations this entity belongs to, filtered by authorization
  const query = {
    where: { entityId: entity.id },
    include: {
      investigation: {
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          userId: true
        }
      }
    }
  };

  const investigationLinks = await dbClient.investigationEntity.findMany(query);

  // Filter investigations based on authorization
  const authorizedInvestigations = investigationLinks.map(link => link.investigation).filter(inv => {
    // Admins and Security Analysts can see all investigations
    if (userRole === 'SYSTEM_ADMIN' || userRole === 'SECURITY_ANALYST') return true;
    
    // Users can only see their own investigations
    // If an investigation has no user, it might be anonymous (public demo). Allow if userId is not enforced, 
    // but in a real system we'd check org membership.
    if (!inv.userId) return true; 
    
    return inv.userId === userId;
  });

  // 3. Count total investigations (global count can be exposed as intelligence signal, without leaking details)
  const totalGlobalOccurrences = investigationLinks.length;

  return {
    entity: {
      id: entity.id,
      type: entity.type,
      rawValue: entity.rawValue,
      normalizedValue: entity.normalizedValue,
      createdAt: entity.createdAt
    },
    intelligence: {
      totalGlobalOccurrences,
      authorizedInvestigations,
      relationships: [
        ...entity.sourceRelations.map(rel => ({
          type: rel.relationshipType,
          confidence: rel.confidence,
          target: rel.targetEntity,
          direction: 'outbound'
        })),
        ...entity.targetRelations.map(rel => ({
          type: rel.relationshipType,
          confidence: rel.confidence,
          target: rel.sourceEntity,
          direction: 'inbound'
        }))
      ]
    }
  };
}

export async function getInvestigationGraph(investigationId: string, userId: string | undefined, userRole: string = 'USER') {
  // 1. Verify access to the investigation
  const investigation = await dbClient.investigation.findUnique({
    where: { id: investigationId }
  });

  if (!investigation) return null;

  if (investigation.userId && investigation.userId !== userId && userRole !== 'SYSTEM_ADMIN' && userRole !== 'SECURITY_ANALYST') {
    throw new Error('Unauthorized access to investigation graph');
  }

  // 2. Fetch all entities linked to this investigation
  const links = await dbClient.investigationEntity.findMany({
    where: { investigationId },
    include: {
      entity: {
        include: {
          sourceRelations: { include: { targetEntity: true } },
          targetRelations: { include: { sourceEntity: true } }
        }
      }
    }
  });

  const entities = links.map(link => link.entity);

  return {
    investigationId,
    entities: entities.map(e => ({
      id: e.id,
      type: e.type,
      normalizedValue: e.normalizedValue,
      relationships: [
        ...e.sourceRelations.map(rel => ({ type: rel.relationshipType, targetId: rel.targetEntityId })),
        ...e.targetRelations.map(rel => ({ type: rel.relationshipType, sourceId: rel.sourceEntityId }))
      ]
    }))
  };
}
