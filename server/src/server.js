const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = require('./app');

const { mongoConnect } = require('./services/mongo');
const { loadPlanetsData } = require('./models/planets.model');
const { loadLaunchesData } = require('./models/launches.model');

const PORT = process.env.PORT || 8000;

const server = https.createServer({
    key: fs.readFileSync(path.join(__dirname, 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'cert.pem'))
}, app);

async function startServer() {
    await mongoConnect();
    await loadPlanetsData();
    await loadLaunchesData();
    server.listen(PORT, () => {
        console.log(`Listening on port ${PORT}...`);
    })
}

startServer();