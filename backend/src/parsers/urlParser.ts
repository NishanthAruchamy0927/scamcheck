import { safeNetworkFetch } from '../engine/network/safeNetworkClient.js';

export interface UrlAnalysisResult {
  text: string;
  domain: string;
  isSuspicious: boolean;
  warnings: string[];
}

export async function analyzeUrlTarget(targetUrl: string): Promise<UrlAnalysisResult> {
  const warnings: string[] = [];
  let isSuspicious = false;

  try {
    const urlObj = new URL(targetUrl);
    const domain = urlObj.hostname;
    const protocol = urlObj.protocol;

    // 1. Protocol Check
    if (protocol === 'http:') {
      warnings.push('Insecure connection protocol (HTTP without TLS encryption)');
      isSuspicious = true;
    }

    // 2. IP Address check
    if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(domain)) {
      warnings.push('URL points directly to an IP address rather than a verified domain name');
      isSuspicious = true;
    }

    // 3. High-Risk TLDs Check
    const highRiskTlds = ['.xyz', '.top', '.tk', '.buzz', '.click', '.live', '.surf', '.space', '.work', '.rest', '.quest'];
    if (highRiskTlds.some((tld) => domain.toLowerCase().endsWith(tld))) {
      warnings.push(`Domain uses a high-risk generic top-level domain (${domain.split('.').pop()}) frequently observed in recruitment phishing`);
      isSuspicious = true;
    }

    // 4. URL Shorteners Check
    const shorteners = ['bit.ly', 'tinyurl.com', 'is.gd', 'cutt.ly', 'rb.gy', 't.co', 't.me', 'wa.me', 'forms.gle'];
    if (shorteners.some((sh) => domain.toLowerCase().includes(sh))) {
      warnings.push(`URL uses a redirection service or unverified communication shortlink (${domain})`);
      isSuspicious = true;
    }

    // 5. Misleading Subdomain / Brand Spoofing Check
    const enterpriseNames = ['google', 'microsoft', 'amazon', 'apple', 'tcs', 'infosys', 'wipro', 'meta', 'netflix', 'goldman'];
    for (const ent of enterpriseNames) {
      if (domain.toLowerCase().includes(ent) && !domain.toLowerCase().endsWith(`.${ent}.com`) && domain.toLowerCase() !== `${ent}.com`) {
        warnings.push(`Suspicious domain configuration: contains enterprise brand '${ent}' inside third-party hostname (${domain})`);
        isSuspicious = true;
      }
    }

    // Safe Page Fetching using Phase 6 safeNetworkClient
    let pageContent = '';
    try {
      const response = await safeNetworkFetch(targetUrl, {
        timeoutMs: 5000,
        maxResponseBytes: 500 * 1024,
      });

      if (response.statusCode >= 200 && response.statusCode < 300) {
        const html = response.data;
        pageContent = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 10000);
      }
    } catch {
      // Fetch failed or timed out; we still have URL characteristics
    }

    const warningText = warnings.length > 0
      ? `\n\nSecurity Warnings:\n${warnings.map((w) => `• ${w}`).join('\n')}`
      : '';

    const text = `Opportunity URL: ${targetUrl}\nDomain: ${domain}\nProtocol: ${protocol}${warningText}${
      pageContent ? `\n\nExtracted Page Content:\n${pageContent}` : '\n\nNote: Destination page content could not be retrieved from external server (external verification unavailable).'
    }`;

    return {
      text,
      domain,
      isSuspicious,
      warnings
    };
  } catch (err: any) {
    return {
      text: `Opportunity URL: ${targetUrl}\nAnalysis: Invalid or unparseable URL structure (${err.message || 'error'}).`,
      domain: targetUrl,
      isSuspicious: true,
      warnings: ['Invalid URL format']
    };
  }
}
