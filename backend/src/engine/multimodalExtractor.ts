import { ExtractedEntity } from './types.js';

/**
 * Reusable entity extraction pipeline for Multimodal Analysis.
 * Detects URL, EMAIL, PHONE, PAYMENT_IDENTIFIER, etc.
 */
export function extractMultimodalEntities(text: string, source: ExtractedEntity['source']): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  if (!text) return entities;

  // 1. Extract URLs
  // Matches http://, https://, www., and basic domain structures.
  const urlRegex = /(?:https?:\/\/|www\.)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/\S*)?/gi;
  const urls = text.match(urlRegex) || [];
  for (const url of urls) {
    entities.push({
      type: 'URL',
      value: url,
      normalizedValue: url.toLowerCase(),
      source,
      confidence: 90
    });
  }

  // 2. Extract Emails
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  const emails = text.match(emailRegex) || [];
  for (const email of emails) {
    entities.push({
      type: 'EMAIL',
      value: email,
      normalizedValue: email.toLowerCase(),
      source,
      confidence: 95
    });
  }

  // 3. Extract Phones
  // Looks for common formats, including +country code
  const phoneRegex = /(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
  const phones = text.match(phoneRegex) || [];
  for (const phone of phones) {
    entities.push({
      type: 'PHONE',
      value: phone,
      normalizedValue: phone.replace(/[^0-9+]/g, ''),
      source,
      confidence: 85
    });
  }

  // 4. Extract Payment Requests / Identifiers (UPI, Crypto, etc)
  const upiRegex = /[a-zA-Z0-9.-]+@[a-zA-Z]+/g;
  // Let's rely on specific domains for UPI (like @okicici, @ybl, @upi)
  const upiMatches = text.match(/[a-zA-Z0-9.-]+@(okicici|ybl|upi|paytm|okhdfcbank|okaxis|okSBI)/gi) || [];
  for (const upi of upiMatches) {
    entities.push({
      type: 'UPI',
      value: upi,
      normalizedValue: upi.toLowerCase(),
      source,
      confidence: 90
    });
  }

  // 5. Currency Amounts (Financial Signals)
  const currencyRegex = /(?:Rs\.?|INR|₹|\$|USD|EUR|€|£|GBP)\s*([\d,]+)/gi;
  const currencies = text.match(currencyRegex) || [];
  for (const cur of currencies) {
    entities.push({
      type: 'CURRENCY',
      value: cur,
      source,
      confidence: 80
    });
  }

  // Deduplicate entities (basic value deduplication per type)
  const uniqueEntities = entities.filter((entity, index, self) =>
    index === self.findIndex((t) => (
      t.type === entity.type && t.value.toLowerCase() === entity.value.toLowerCase()
    ))
  );

  return uniqueEntities;
}
