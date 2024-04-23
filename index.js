require('dotenv').config();
const express = require('express');
const spotifyWebApi = require('spotify-web-api-node');

const app = express();
const port = 3050;

const spotifyApi = new spotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI,
});

app.get('/login', (req, res) => {
    const scopes = ['user-read-private','user-read-email', 'user-modify-playback-state'];
    res.redirect(spotifyApi.createAuthorURL(scopes));
});

app.get('/callback', (req, res) => {
    const error = req.query.error;
    const code =  req.query.code;

    if(error){
        console.error('Error:', error);
        res.send('Error: ${error}');
        return;
    }
    spotifyApi.authorizationCodeGrant(code).then(data => {
        const accessToken = data.body['accessToken'];
        const refreshToken = data.body['refreshToken'];
        const expires_in = data.body['expires_in'];

        spotifyApi.setAccessToken(accessToken);
        spotifyApi.setRefreshToken(refreshToken);

        console.log('The access token is ', accessToken);
        console.log('The refresh token is ', refreshToken);

        console.log[accessToken,refreshToken];
        res.send('Login successful! You can now use the /search and /play endpoints');

        setInterval(async () => {
           const data = await spotifyApi.refreshAccessToken();
              const accessToken = data.body['access_token'];
              spotifyApi.setAccessToken(accessToken);

    }, expires_in / 2 * 1000);
    }).catch(error => {
        console.error('Error getting Tokens', error);
        res.send('Error getting tokens}');
    });
});

app.get('/search', (req, res) => {
    const {q} = req.query;
spotifyApi.searchTracks(q).then(searchData => {
    const trackUri = searchData.body.tracks.items[0].uri;
    res.send({uri:trackUri});
}).catch(err => {
    console.error('Search Error', err);
    res.send('Error occured during search');
});
});

app.get('/play', (req, res) => {
    const {uri} = req.query;
    spotifyApi.play({uris: [uri]}).then(() => {
        res.send('playback started');
    }).catch(err => {
        console.error('Play Error', error);
        res.send('Error occured during playback');
    });
});

app.listen(port, () => {
    console.log('Server started on http://localhost:${port}');
});
