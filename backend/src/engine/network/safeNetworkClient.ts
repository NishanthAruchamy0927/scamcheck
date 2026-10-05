import dns from 'dns';
import net from 'net';
import { promisify } from 'util';
import http from 'http';
import https from 'https';

const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);

// Simple IP parsing and blocking for SSRF
function parseIPv4(ip: string): number[] {
  return ip.split('.').map(Number);
}

function isPrivateIPv4(ip: string): boolean {
  if (ip === '0.0.0.0' || ip === '255.255.255.255') return true;
  const parts = parseIPv4(ip);
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) return true; // Malformed is treated as private/unsafe
  
  const [a, b] = parts;
  
  if (a === 127) return true; // 127.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 169 && b === 254) return true; // 169.254.0.0/16
  if (a === 0) return true; // 0.0.0.0/8
  
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  // Simplified IPv6 checks
  if (ip === '::1') return true;
  if (ip.startsWith('fc00:') || ip.startsWith('fd')) return true; // fc00::/7
  if (ip.startsWith('fe80:')) return true; // fe80::/10
  if (ip.startsWith('::ffff:')) {
    // IPv4-mapped IPv6
    const ipv4 = ip.split(':').pop()!;
    return isPrivateIPv4(ipv4);
  }
  return false;
}

function isSafeIP(ip: string, family: 4 | 6): boolean {
  if (family === 4) return !isPrivateIPv4(ip);
  if (family === 6) return !isPrivateIPv6(ip);
  return false;
}

function shouldUseSni(hostname: string): boolean {
  return !net.isIP(hostname);
}

export interface SafeFetchOptions {
  timeoutMs?: number;
  maxRedirects?: number;
  maxResponseBytes?: number;
  method?: string;
  headers?: Record<string, string>;
}

export interface SafeFetchResponse {
  statusCode: number;
  headers: Record<string, string | string[] | undefined>;
  data: string;
  url: string;
}

export async function safeNetworkFetch(
  targetUrl: string,
  options: SafeFetchOptions = {}
): Promise<SafeFetchResponse> {
  let currentUrl = targetUrl;
  let redirects = 0;
  const maxRedirects = options.maxRedirects ?? 3;
  const timeoutMs = options.timeoutMs ?? 5000;
  const maxResponseBytes = options.maxResponseBytes ?? 500 * 1024; // 500KB default

  while (redirects <= maxRedirects) {
    const urlObj = new URL(currentUrl);
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      throw new Error(`Unsupported protocol: ${urlObj.protocol}`);
    }

    const domain = urlObj.hostname;
    if (net.isIP(domain)) {
      throw new Error('SSRF Prevention: URL points directly to an IP address rather than a verified domain name');
    }
    
    // Resolve DNS manually to prevent SSRF and DNS rebinding
    let addresses: { address: string; family: 4 | 6 }[] = [];
    
    try {
      const ipv4s = await resolve4(domain);
      addresses.push(...ipv4s.map(ip => ({ address: ip, family: 4 as 4 })));
    } catch (e) {}

    if (addresses.length === 0) {
      try {
        const ipv6s = await resolve6(domain);
        addresses.push(...ipv6s.map(ip => ({ address: ip, family: 6 as 6 })));
      } catch (e) {}
    }

    if (addresses.length === 0) {
      throw new Error(`DNS resolution failed for ${domain}`);
    }

    // Pick first safe IP
    const safeAddress = addresses.find(a => isSafeIP(a.address, a.family));
    if (!safeAddress) {
      throw new Error(`SSRF Prevention: Resolved to private/reserved IP for ${domain}`);
    }

    const response = await new Promise<SafeFetchResponse>((resolve, reject) => {
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;
      const port = urlObj.port ? parseInt(urlObj.port) : (isHttps ? 443 : 80);

      const reqOptions: https.RequestOptions = {
        method: options.method || 'GET',
        hostname: safeAddress.address, // Connect to IP directly
        port,
        path: urlObj.pathname + urlObj.search,
        headers: {
          'Host': domain, // Spoof Host header to real domain
          'User-Agent': 'ScamCheck-Security-Analyzer/1.0',
          ...(options.headers || {})
        },
        timeout: timeoutMs,
        ...(isHttps && shouldUseSni(domain) ? { servername: domain } : {}),
      };

      const req = client.request(reqOptions, (res) => {
        const statusCode = res.statusCode || 500;
        
        // Handle Redirects
        if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
          res.resume(); // drain the redirect body so the socket is released
          try {
            currentUrl = new URL(res.headers.location, currentUrl).toString();
            resolve({ statusCode: -1, headers: {}, data: '', url: currentUrl }); // Signal redirect
          } catch (e) {
            reject(new Error(`Invalid redirect location: ${res.headers.location}`));
          }
          return;
        }

        let size = 0;
        const chunks: Buffer[] = [];

        // res.destroy(err) below emits 'error' on the response; without a listener
        // that would be an uncaught exception that takes down the server.
        res.on('error', reject);

        res.on('data', (chunk) => {
          size += chunk.length;
          if (size > maxResponseBytes) {
            res.destroy(new Error('Response size limit exceeded'));
            return;
          }
          chunks.push(chunk);
        });

        res.on('end', () => {
          resolve({
            statusCode,
            headers: res.headers,
            data: Buffer.concat(chunks).toString('utf-8'),
            url: currentUrl
          });
        });
      });

      req.on('timeout', () => {
        req.destroy(new Error('Request timeout'));
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.end();
    });

    if (response.statusCode === -1) {
      redirects++;
      continue;
    }

    return response;
  }

  throw new Error(`Too many redirects (max ${maxRedirects})`);
}
