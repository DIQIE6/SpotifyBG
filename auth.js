const express = require('express');
const axios = require('axios');
const app = express();
const port = 9999;
require('dotenv').config({ path: __dirname + '/.env' });
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const refresh_token = process.env.REFRESH_TOKEN;

app.get('/login', (res) => {
  const scope = 'user-read-currently-playing';
  res.redirect(
    `https://accounts.spotify.com/authorize?response_type=code&client_id=${client_id}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirect_uri)}`
  );
});

app.get('/callback', async (req, res) => {
  const code = req.query.code || null;

  const params = new URLSearchParams();
  params.append('code', code);
  params.append('redirect_uri', redirect_uri);
  params.append('grant_type', 'authorization_code');

  const auth = Buffer.from(`${client_id}:${client_secret}`).toString('base64');

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', params, {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    res.send(`
      <h1>Refresh_Token GOT!</h1>
      <p><b>Refresh_Token:</b> ${response.data.refresh_token}</p>
      <p>Copy the refresh_token above to .env file </p>
      <p>请将上面的 refresh_token 复制粘贴到你的 .env 文件中</p>
    `);
  } catch (error) {
    res.send('Error getting tokens: ' + JSON.stringify(error.response?.data || error.message));
  }
});

app.listen(port, () => {
  console.log(`Auth server running on http://localhost:${port}`);
});
