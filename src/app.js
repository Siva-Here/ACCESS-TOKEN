const express = require('express');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const startDB = require('../db/conn');
const Token = require('../model/token'); // Adjust the path as needed

// Use environment variables
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI =process.env.REDIRECT_URI;
// Create an OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Load tokens from file if they exist
let tokens = {};
const tokensPath = path.join(__dirname, 'tokens.json');
if (fs.existsSync(tokensPath)) {
  tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
  oauth2Client.setCredentials(tokens);
}

// Create an Express app
const app = express();

// Generate an auth URL for obtaining the authorization code
app.get('/auth', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',  // Ensures refresh token is sent
    scope: ['https://www.googleapis.com/auth/drive.file'],
    prompt: 'consent',       // Forces consent screen to reappear
    redirect_uri: REDIRECT_URI,
  });
  res.redirect(authUrl);
});


// Handle the OAuth2 callback and store tokens
app.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('Authorization code not found');
  }
  console.log("Received code:", code);

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    console.log("Tokens received:", tokens);

    // Save the refresh token to the database
    if (tokens.refresh_token) {
      await Token.findByIdAndUpdate(
        { _id: "669f7f5945fe1c61cdba611b" },
        { refreshToken: tokens.refresh_token },
        { upsert: true }
      );
      console.log('Refresh token saved to database.');
      return res.status(201).json({ message: "Successfully stored refreshToken" });
    } else {
      console.log('No refresh token received.');
    }

    res.send('Authorization successful! Tokens have been saved.');
  } catch (error) {
    console.error('Error getting tokens:', error);
    res.status(500).send(`Error getting tokens: ${error.message}`);
  }
});



startDB().then(() => {
  start();
});

// Start the server
const start = async () => {
  try {
    app.listen(process.env.PORT, () => {
      console.log(`Server Running successfully on ${process.env.PORT}`);
      if (!tokens.refresh_token) {
        console.log(`Visit http://localhost:${process.env.PORT}/auth to authorize the app.`);
      }
    });
  } catch (err) {
    console.log(err);
  }
};
