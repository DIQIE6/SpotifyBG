const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); 
require('dotenv').config({ path: __dirname + '/.env' });
const app = express();
const port = 8888;
app.use(cors());

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const refresh_token = process.env.REFRESH_TOKEN;

async function refreshAccessToken() {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization:
        'Basic ' +
        Buffer.from(`${client_id}:${client_secret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Failed to refresh token:', data);
    throw new Error(data.error_description || 'Token refresh failed');
  }

  return data.access_token;
}

refreshAccessToken()

setInterval(refreshAccessToken, 30 * 60 * 1000);

async function fetchWebApi(endpoint, token) {
  const response = await fetch(`https://api.spotify.com/${endpoint}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (response.status === 204) return null;
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Spotify API error (${response.status}): ${err}`);
  }

  return await response.json();
}

app.get('/currently-playing', async (res) => {
  try {
    const access_token = await refreshAccessToken();

    const data = await fetchWebApi('v1/me/player/currently-playing', access_token);

    if (!data || !data.item || !data.is_playing) {
      return res.json({ is_playing: false });
    }

    const track = data.item;

    res.json({
      is_playing: data.is_playing,
      name: track.name,
      artists: track.artists.map(a => a.name),
      album: track.album.name,
      duration_ms: track.duration_ms,
      progress_ms: data.progress_ms,
      album_image: track.album.images?.[0]?.url || null
    });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

app.get('/analysis/:id', async (req, res) => {
  const trackId = req.params.id;
  const analysis = await fetchWebApi(`v1/audio-analysis/${trackId}`, 'GET');
  res.json(analysis);
});


app.listen(port, () => {
  console.log(`Spotify backend running at http://localhost:${port}`);
});
