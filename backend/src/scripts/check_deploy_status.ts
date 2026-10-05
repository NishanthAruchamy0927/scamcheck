import https from 'https';

const API_KEY = process.env.RENDER_API_KEY || process.argv[2];
const SERVICE_ID = process.env.RENDER_SERVICE_ID || process.argv[3] || 'srv-da5cu6bncjis738hoesg';

if (!API_KEY) {
  console.log('Provide RENDER_API_KEY as env var or arg');
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
