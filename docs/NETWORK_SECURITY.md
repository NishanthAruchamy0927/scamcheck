# Network Security & SSRF Protection (Phase 6)

## The Threat Model
Because ScamCheck is a cybersecurity intelligence platform, it frequently extracts URLs, Domains, and IP addresses from user submissions and evaluates them. This creates a high-risk vector for **Server-Side Request Forgery (SSRF)**. 
A malicious user could submit an opportunity containing a link to `http://169.254.169.254/latest/meta-data/` or `http://localhost:5432` attempting to probe internal AWS metadata or local databases.

## SafeNetworkClient
To mitigate this, all external outbound verification requests strictly utilize the `SafeNetworkClient` module (`backend/src/engine/network/safeNetworkClient.ts`). 
Arbitrary usage of standard Node.js `fetch()` within controllers is strictly prohibited.

### SSRF Mitigation Controls
1. **Manual DNS Resolution**: The client natively resolves the target hostname using `dns.resolve4` and `dns.resolve6` rather than delegating DNS to the HTTP agent.
2. **IP Space Validation**: The resolved IP addresses are explicitly checked against a denylist of private, loopback, and reserved subnets:
   - `127.0.0.0/8` (Loopback)
   - `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` (RFC 1918 Private)
   - `169.254.0.0/16` (Cloud Metadata Services)
   - `0.0.0.0/8` (Current Network)
   - `fc00::/7`, `fe80::/10`, `::1/128` (IPv6 Private/Loopback)
3. **Anti-DNS Rebinding**: The connection is made directly to the validated IP address (`http.request({ hostname: IP })`), while the `Host` header (and TLS `servername`) is spoofed to match the original requested domain. This effectively nullifies time-of-check to time-of-use (TOCTOU) DNS rebinding attacks, as the IP cannot change post-validation.

### Protocol and Resource Limits
- **Allowed Protocols**: Strictly limited to `http:` and `https:`. `file:`, `ftp:`, `gopher:`, etc., are blocked.
- **Timeouts**: Hardcapped at 5 seconds to prevent tarpitting (Slowloris-style denial of service).
- **Response Size Limits**: Payload streams are destroyed if they exceed 500KB to prevent memory exhaustion attacks (Billion Laughs style memory filling).
- **Redirect Limits**: Max 3 redirects. Each redirect triggers a complete re-evaluation of the DNS resolution and IP safety checks.
