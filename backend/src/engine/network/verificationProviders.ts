import dns from 'dns';
import net from 'net';
import { promisify } from 'util';
import tls from 'tls';
import { safeNetworkFetch } from './safeNetworkClient.js';

const resolveTxt = promisify(dns.resolveTxt);
const resolveMx = promisify(dns.resolveMx);
const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);

export interface DnsVerificationResult {
  status: 'VERIFIED' | 'UNVERIFIED' | 'UNAVAILABLE';
  hasA: boolean;
  hasMx: boolean;
  notes: string[];
}

export async function verifyDns(domain: string): Promise<DnsVerificationResult> {
  const notes: string[] = [];
  let hasA = false;
  let hasMx = false;
  
  try {
    const a = await resolve4(domain).catch(() => []);
    const aaaa = await resolve6(domain).catch(() => []);
    if (a.length > 0 || aaaa.length > 0) hasA = true;
    
    const mx = await resolveMx(domain).catch(() => []);
    if (mx.length > 0) hasMx = true;
    
    if (hasA) notes.push('Domain resolves to IP addresses.');
    if (hasMx) notes.push('Domain has mail exchange (MX) records.');

    return {
      status: hasA ? 'VERIFIED' : 'UNVERIFIED',
      hasA,
      hasMx,
      notes
    };
  } catch (error) {
    return { status: 'UNAVAILABLE', hasA: false, hasMx: false, notes: ['DNS resolution failed or timed out.'] };
  }
}

export interface TlsVerificationResult {
  status: 'VERIFIED' | 'UNVERIFIED' | 'UNAVAILABLE';
  issuer: string | null;
  validFrom: string | null;
  validTo: string | null;
  notes: string[];
}

export async function verifyTls(domain: string): Promise<TlsVerificationResult> {
  if (net.isIP(domain)) {
    return {
      status: 'UNAVAILABLE',
      issuer: null,
      validFrom: null,
      validTo: null,
      notes: ['TLS verification is unavailable for direct IP literal hosts.']
    };
  }

  return new Promise((resolve) => {
    const socket = tls.connect({
      host: domain,
      port: 443,
      ...(net.isIP(domain) ? {} : { servername: domain }),
    }, () => {
      const authorized = socket.authorized;
      const cert = socket.getPeerCertificate();
      
      let issuerVal = cert.issuer?.O || cert.issuer?.CN || null;
      if (Array.isArray(issuerVal)) issuerVal = issuerVal[0];
      const issuer = issuerVal as string | null;
      const notes = [];
      if (authorized) notes.push('TLS certificate is valid and trusted.');
      else notes.push('TLS certificate is invalid, self-signed, or untrusted.');
      
      if (issuer) notes.push(`Certificate issued by: ${issuer}`);
      
      resolve({
        status: authorized ? 'VERIFIED' : 'UNVERIFIED',
        issuer,
        validFrom: cert.valid_from,
        validTo: cert.valid_to,
        notes
      });
      socket.destroy();
    });

    socket.setTimeout(4000, () => {
      socket.destroy();
      resolve({ status: 'UNAVAILABLE', issuer: null, validFrom: null, validTo: null, notes: ['TLS connection timed out.'] });
    });

    socket.on('error', (err) => {
      resolve({ status: 'UNAVAILABLE', issuer: null, validFrom: null, validTo: null, notes: [`TLS connection failed: ${err.message}`] });
    });
  });
}

export interface EmailAuthVerificationResult {
  hasMx: boolean;
  spfStatus: 'SPF_PRESENT' | 'SPF_ABSENT' | 'UNAVAILABLE';
  dmarcStatus: 'DMARC_PRESENT' | 'DMARC_ABSENT' | 'UNAVAILABLE';
  notes: string[];
}

export async function verifyEmailInfrastructure(domain: string): Promise<EmailAuthVerificationResult> {
  let hasMx = false;
  let spfStatus: EmailAuthVerificationResult['spfStatus'] = 'SPF_ABSENT';
  let dmarcStatus: EmailAuthVerificationResult['dmarcStatus'] = 'DMARC_ABSENT';
  const notes: string[] = [];

  try {
    const mx = await resolveMx(domain).catch(() => []);
    hasMx = mx.length > 0;
    if (hasMx) notes.push('MX records found (domain can receive email).');
    else notes.push('No MX records found.');

    const txtRecords = await resolveTxt(domain).catch(() => []);
    const flattenedTxt = txtRecords.map(r => r.join(''));
    const spfRecord = flattenedTxt.find(r => r.startsWith('v=spf1'));
    if (spfRecord) {
      spfStatus = 'SPF_PRESENT';
      notes.push('SPF policy record is present.');
    } else {
      notes.push('No SPF policy found.');
    }

    const dmarcRecords = await resolveTxt(`_dmarc.${domain}`).catch(() => []);
    const flattenedDmarc = dmarcRecords.map(r => r.join(''));
    const dmarcRecord = flattenedDmarc.find(r => r.startsWith('v=DMARC1'));
    if (dmarcRecord) {
      dmarcStatus = 'DMARC_PRESENT';
      notes.push('DMARC policy record is present.');
    } else {
      notes.push('No DMARC policy found.');
    }

  } catch (error) {
    notes.push('Email infrastructure verification encountered an error.');
    return { hasMx, spfStatus: 'UNAVAILABLE', dmarcStatus: 'UNAVAILABLE', notes };
  }

  return { hasMx, spfStatus, dmarcStatus, notes };
}

export interface RdapVerificationResult {
  status: 'AVAILABLE' | 'UNAVAILABLE';
  registrationDate: string | null;
  expirationDate: string | null;
  registrar: string | null;
  notes: string[];
}

export async function verifyRdap(domain: string): Promise<RdapVerificationResult> {
  try {
    const rdapUrl = `https://rdap.org/domain/${domain}`;
    const res = await safeNetworkFetch(rdapUrl, { timeoutMs: 4000 });
    
    if (res.statusCode === 200) {
      const data = JSON.parse(res.data);
      let registrationDate = null;
      let expirationDate = null;
      
      if (data.events) {
        const regEvent = data.events.find((e: any) => e.eventAction === 'registration');
        if (regEvent) registrationDate = regEvent.eventDate;
        
        const expEvent = data.events.find((e: any) => e.eventAction === 'expiration');
        if (expEvent) expirationDate = expEvent.eventDate;
      }
      
      let registrar = null;
      if (data.entities) {
        const regEntity = data.entities.find((e: any) => e.roles?.includes('registrar'));
        if (regEntity && regEntity.vcardArray && regEntity.vcardArray[1]) {
          const fn = regEntity.vcardArray[1].find((v: any) => v[0] === 'fn');
          if (fn) registrar = fn[3];
        }
      }
      
      const notes = [];
      if (registrationDate) {
        const ageDays = Math.floor((Date.now() - new Date(registrationDate).getTime()) / (1000 * 60 * 60 * 24));
        notes.push(`Domain registered ${ageDays} days ago (${registrationDate}).`);
      }
      if (registrar) notes.push(`Registrar: ${registrar}`);
      
      return { status: 'AVAILABLE', registrationDate, expirationDate, registrar, notes };
    }
  } catch (e) {
    // silently fail and return unavailable
  }
  return { status: 'UNAVAILABLE', registrationDate: null, expirationDate: null, registrar: null, notes: ['RDAP registration data could not be retrieved.'] };
}
