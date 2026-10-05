import https from 'https';

const API_KEY = process.env.RENDER_API_KEY || process.argv[2];

if (!API_KEY) {
  console.error('No RENDER_API_KEY provided. Set RENDER_API_KEY env var or pass as argument.');
  process.exit(1);
}

function apiRequest(method: string, path: string, payload?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const dataString = payload ? JSON.stringify(payload) : undefined;
    const req = https.request(
      {
        hostname: 'api.render.com',
        path,
        method,
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(dataString ? { 'Content-Length': Buffer.byteLength(dataString) } : {})
        }
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            const parsed = body ? JSON.parse(body) : {};
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              reject(new Error(`API ${res.statusCode}: ${body}`));
            }
          } catch (e) {
            reject(new Error(`Parse error (${res.statusCode}): ${body}`));
          }
        });
      }
    );
    req.on('error', reject);
    if (dataString) req.write(dataString);
    req.end();
  });
}

async function runDeploy() {
  console.log('🔍 Fetching Render account owner details...');
  const owners = await apiRequest('GET', '/v1/owners');
  if (!owners || owners.length === 0) {
    throw new Error('No owner account found for this API key.');
  }

  const owner = owners[0].owner || owners[0];
  const ownerId = owner.id;
  console.log(`✅ Authenticated as: ${owner.name || owner.email} (Owner ID: ${ownerId})`);

  console.log('🚀 Checking existing services or creating new web service...');
  const existingServices = await apiRequest('GET', `/v1/services?ownerId=${ownerId}`);
  const existingScamcheck = existingServices.find((s: any) => s.service?.name === 'scamcheck' || s.service?.repo?.includes('hackspora-HS2026-148'));

  if (existingScamcheck) {
    const serviceId = existingScamcheck.service.id;
    console.log(`⚡ Existing service found: ${serviceId}`);
    console.log(`🌐 Service URL: ${existingScamcheck.service.serviceDetails?.url || `https://${existingScamcheck.service.slug}.onrender.com`}`);
    console.log('🔄 Triggering latest deploy on main branch...');
    const deployRes = await apiRequest('POST', `/v1/services/${serviceId}/deploys`, { clearCache: 'do_not_clear' });
    console.log('🎉 Deploy triggered successfully!');
    console.log(`📦 Deploy ID: ${deployRes.id}`);
    console.log(`🔗 Dashboard: https://dashboard.render.com/web/${serviceId}`);
    console.log(`🌍 Live App URL: ${existingScamcheck.service.serviceDetails?.url || `https://${existingScamcheck.service.slug}.onrender.com`}`);
    return;
  }

  console.log('📦 Creating new Render Web Service for SCAMCHECK...');
  const newServicePayload = {
    type: 'web_service',
    name: 'scamcheck',
    ownerId,
    repo: 'https://github.com/Harish-Raja-R/hackspora-HS2026-148',
    branch: 'main',
    autoDeploy: 'yes',
    serviceDetails: {
      env: 'node',
      plan: 'free',
      region: 'singapore',
      envSpecificDetails: {
        buildCommand: 'npm run postinstall && npm run build',
        startCommand: 'npm start'
      },
      envVars: [
        { key: 'NODE_ENV', value: 'production' },
        { key: 'PORT', value: '5001' }
      ]
    }
  };

  const createdService = await apiRequest('POST', '/v1/services', newServicePayload);
  const service = createdService.service || createdService;

  console.log('🎉 Web Service successfully created and deploying on Render!');
  console.log(`🆔 Service ID: ${service.id}`);
  console.log(`🔗 Render Dashboard: https://dashboard.render.com/web/${service.id}`);
  const liveUrl = service.serviceDetails?.url || `https://${service.slug}.onrender.com`;
  console.log(`🌍 Live Application URL: ${liveUrl}`);
}

runDeploy().catch((err) => {
  console.error('❌ Deployment error:', err.message);
  process.exit(1);
});
