export interface ParsedUpi {
  identifier: string | null;
  payeeName: string | null;
  merchantCode: string | null;
  transactionRef: string | null;
  declaredAmount: string | null;
  declaredCurrency: string | null;
  url: string | null;
  formatValid: boolean;
}

/**
 * Robust parsing for UPI URIs and raw VPA formats.
 * E.g., upi://pay?pa=merchant@example&pn=Merchant%20Name
 */
export function parseUpiPayload(payload: string): ParsedUpi {
  const result: ParsedUpi = {
    identifier: null,
    payeeName: null,
    merchantCode: null,
    transactionRef: null,
    declaredAmount: null,
    declaredCurrency: null,
    url: null,
    formatValid: false
  };

  const normalized = payload.trim();

  // Basic VPA validation regex
  // Format: alphanumeric/dot/dash/underscore @ bank/provider
  const upiIdRegex = /^[a-zA-Z0-9.\-_]+@[a-zA-Z0-9]+$/;

  if (normalized.startsWith('upi://')) {
    result.url = normalized;
    try {
      const parsedUrl = new URL(normalized);
      if (parsedUrl.protocol === 'upi:' && parsedUrl.hostname === 'pay') {
        const params = parsedUrl.searchParams;
        result.identifier = params.get('pa');
        result.payeeName = params.get('pn');
        result.merchantCode = params.get('mc');
        result.transactionRef = params.get('tr') || params.get('tid');
        result.declaredAmount = params.get('am');
        result.declaredCurrency = params.get('cu');
        
        if (result.identifier && upiIdRegex.test(result.identifier)) {
          result.formatValid = true;
        }
      }
    } catch (e) {
      // URL parsing failed
    }
  } else if (upiIdRegex.test(normalized)) {
    // Just a raw VPA (Virtual Payment Address)
    result.identifier = normalized;
    result.formatValid = true;
  }

  // Normalize the identifier if valid
  if (result.identifier) {
    result.identifier = result.identifier.toLowerCase();
  }

  return result;
}
