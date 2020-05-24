import * as functions from 'firebase-functions';
import * as express from 'express';
import * as cors from 'cors';

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript

const app = express();

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));

app.get('dailytask', (req, res) => {
    res.send('Done!');
});

export const helloWorld = functions.https.onRequest(app);