const https = require('https');
https.get('https://ahujakush.github.io/grow-with-kush/app.js?v=2', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(data.includes('handleGoogleLogin') ? "Changes are LIVE" : "Changes are NOT LIVE"));
});
