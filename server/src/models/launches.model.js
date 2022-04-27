// pw:vtJ0KlG2c4BLPEbS
// user:nasa-api
// mongodb+srv://nasa-api:<password>@nasacluster.au3im.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
const axios = require('axios');
const launchesDB = require('./launches.mongo');
const planets = require('./planets.mongo');


const DEFAULT_FLIGHT_NUMBER = 100;
const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query';

async function populateLaunches() {
    console.log('Dowloading launch data...');
    const response = await axios.post(SPACEX_API_URL, {
        query: {},
        options: {
            pagination: false,
            populate: [
                {
                    path: 'rocket',
                    select: 
                    {
                        name: 1
                    }
                },
                {
                    path: 'payloads',
                    select: 
                    {
                        'customers': 1
                    }
                }
            ]
        }
    });

    if (response.status !== 200) {
        console.log('problem downloading launch data');
        throw new Error('Launch data download failed');
    }

    const launchDocs = response.data.docs;
    for (const launchDoc of launchDocs) {
        const payloads = launchDoc['payloads'];
        const customers = payloads.flatMap((payload) => {
            return payload['customers'];
        });

        const launch = {
            flightNumber: launchDoc['flight_number'],
            mission: launchDoc['name'],
            rocket: launchDoc['rocket']['name'],
            launchDate: launchDoc['date_local'],
            upcoming: launchDoc['upcoming'],
            success: launchDoc['success'],
            customers
        };

        console.log(`${launch.flightNumber} ${launch.mission}`);
        await saveLaunch(launch);
    }
}

async function loadLaunchesData() {
    const firstLaunch = await findLaunch({
        flightNumber: 1,
        rocket: 'Falcon 1',
        mission: 'FalconSat'
    });
    if (firstLaunch) {
        console.log('launch data already loaded');
    } else {
        await populateLaunches();
    }

}
async function findLaunch(filter) {
    return await launchesDB.findOne(filter)
}
async function isLaunchExists(launchId) {
    return await findLaunch({
        flightNumber: launchId
    });
}

async function getLatestFlightNumber() {
    const latestLaunch = await launchesDB
        .findOne()
        .sort('-flightNumber');

    if (!latestLaunch) {
        return DEFAULT_FLIGHT_NUMBER;
    }
    return latestLaunch.flightNumber;
}
async function getAllLaunches(skip, limit) {
    return await launchesDB
        .find({}, {'_id': 0, '__v': 0}) 
        .skip(skip) 
        .limit(limit)
        .sort({
            flightNumber: 1
        });
}

async function saveLaunch(launch) {
    await launchesDB.findOneAndUpdate({
        flightNumber: launch.flightNumber
    }, 
    launch,
    {
        upsert: true
    });
}

async function scheduleNewLaunch(launch) {
    const planet = await planets.findOne({
        keplerName: launch.target
    });

    if (!planet) {
        throw new Error('no matching planet was found');
    }
    const newFlightNumber = await getLatestFlightNumber() + 1
    const newLaunch = Object.assign(launch, {
        flightNumber: newFlightNumber,
        upcoming: true,
        success: true,
        customers: ['Zero to Mastery', 'NASA']
    });

    await saveLaunch(newLaunch);
}

async function abortLaunch(launchId) {
    const aborted = await launchesDB.updateOne({
        flightNumber: launchId
    }, {
        upcoming: false,
        success: false
    });
    return aborted.modifiedCount === 1;
}
module.exports = {
    loadLaunchesData,
    isLaunchExists,
    getAllLaunches,
    scheduleNewLaunch,
    abortLaunch
}