import https from 'https';

// Credentials come from the environment only: CLI arguments leak into shell history and process lists
const API_KEY = process.env.RENDER_API_KEY;
const SERVICE_ID = process.env.RENDER_SERVICE_ID;

if (!API_KEY || !SERVICE_ID) {
  console.log('Set RENDER_API_KEY and RENDER_SERVICE_ID environment variables');
  process.exit(1);
}

const req = https.request(
  {
    hostname: 'api.render.com',
    path: `/v1/services/${SERVICE_ID}/deploys?limit=1`,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Accept': 'application/json'
    }
  },
  (res) => {
    let body = '';
    res.on('data', (c) => (body += c));
    res.on('end', () => {
      try {
        const list = JSON.parse(body);
        const d = list[0]?.deploy || list[0];
        console.log('STATUS:' + d?.status);
        console.log('COMMIT:' + (d?.commit?.id || 'latest'));
        console.log('CREATED:' + d?.createdAt);
        console.log('FINISHED:' + d?.finishedAt);
      } catch (e) {
        console.error('Error parsing response:', body);
      }
    });
  }
);

req.on('error', (e) => console.error('Request error:', e.message));
req.end();
