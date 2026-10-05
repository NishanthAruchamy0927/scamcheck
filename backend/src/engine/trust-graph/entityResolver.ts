import crypto from 'crypto';

export type EntityType = 
  | 'ORGANIZATION'
  | 'PERSON'
  | 'RECRUITER'
  | 'EMAIL'
  | 'PHONE'
  | 'DOMAIN'
  | 'URL'
  | 'UPI'
  | 'PAYMENT_IDENTIFIER'
  | 'CRYPTO_ADDRESS'
  | 'SOCIAL_HANDLE'
  | 'JOB'
  | 'OTHER';

export interface CanonicalEntity {
  type: EntityType;
  rawValue: string;
  normalizedValue: string;
  fingerprint: string;
}

export function normalizeEntity(type: EntityType, rawValue: string): string {
  let normalized = rawValue.trim().toLowerCase();

  if (type === 'EMAIL') {
    return normalized;
  }
  
  if (type === 'URL' || type === 'DOMAIN') {
    // Remove protocol and trailing slashes for basic normalization
    normalized = normalized.replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (type === 'DOMAIN') {
      // Very basic domain extraction if they pass a URL as a domain
      normalized = normalized.split('/')[0];
    }
    return normalized;
  }
  
  if (type === 'PHONE') {
    // Remove all non-numeric characters except leading +
    const hasPlus = rawValue.trim().startsWith('+');
    normalized = rawValue.replace(/\D/g, '');
    if (hasPlus) normalized = '+' + normalized;
    return normalized;
  }

  // Organizations and Persons often have punctuation and spacing differences
  if (type === 'ORGANIZATION' || type === 'PERSON' || type === 'RECRUITER') {
    normalized = normalized.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
    return normalized;
  }

  return normalized;
}

export function generateFingerprint(type: EntityType, normalizedValue: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(`${type}:${normalizedValue}`);
  return hash.digest('hex');
}

export function resolveEntity(type: EntityType, rawValue: string): CanonicalEntity {
  const normalizedValue = normalizeEntity(type, rawValue);
  const fingerprint = generateFingerprint(type, normalizedValue);

  return {
    type,
    rawValue,
    normalizedValue,
    fingerprint
  };
}

export function extractDomainFromUrlOrEmail(type: EntityType, normalizedValue: string): string | null {
  if (type === 'EMAIL') {
    const parts = normalizedValue.split('@');
    if (parts.length === 2) {
      return parts[1];
    }
  }
  
  if (type === 'URL') {
    try {
      // Must add protocol if missing for URL parsing
      const urlStr = normalizedValue.startsWith('http') ? normalizedValue : `https://${normalizedValue}`;
      const url = new URL(urlStr);
      return url.hostname;
    } catch (err) {
      return null;
    }
  }

  return null;
}
