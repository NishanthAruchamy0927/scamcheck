import https from 'https';

async function deployToRender(apiKey?: string) {
  const key = apiKey || process.env.RENDER_API_KEY;

  if (!key) {
    console.log('============================================================');
    console.log('🔑 RENDER API KEY REQUIRED FOR DIRECT SCRIPT DEPLOYMENT');
    console.log('============================================================');
    console.log('To deploy programmatically via Render API:');
    console.log('1. Go to: https://dashboard.render.com/account/api-keys');
    console.log('2. Click "Create API Key"');
    console.log('3. Run: $env:RENDER_API_KEY="rnd_your_key_here"; npx tsx backend/src/scripts/deploy_render.ts');
    console.log('\nOr simply click the 1-Click Render Deploy URL:');
    console.log('👉 https://render.com/deploy?repo=https://github.com/Harish-Raja-R/hackspora-HS2026-148\n');
    return;
  }

  console.log('🚀 Initiating automated Render Web Service deployment via API...');

  const payload = JSON.stringify({
    type: 'web_service',
    name: 'scamcheck',
    ownerId: undefined, // auto-select default owner
    repo: 'https://github.com/Harish-Raja-R/hackspora-HS2026-148',
    branch: 'main',
    env: 'node',
    plan: 'free',
    buildCommand: 'npm run postinstall && npm run build',
    startCommand: 'npm start',
    envVars: [
      { key: 'NODE_ENV', value: 'production' },
      { key: 'PORT', value: '5001' }
    ]
  });

  const options = {
    hostname: 'api.render.com',
    path: '/v1/services',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => {
      if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
        const responseData = JSON.parse(data);
        console.log('✅ Service created successfully on Render!');
        console.log(`🌐 Service ID: ${responseData.id}`);
        console.log(`🔗 Dashboard URL: https://dashboard.render.com/web/${responseData.id}`);
      } else {
        console.error(`❌ Render API Error (HTTP ${res.statusCode}):`, data);
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Request error:', e.message);
  });

  req.write(payload);
  req.end();
}

const argKey = process.argv[2];
deployToRender(argKey);
