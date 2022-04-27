const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');

const planets = require('./planets.mongo');

function isHabitablePlanet(planet) {
    return planet['koi_disposition'] === 'CONFIRMED'
        && planet['koi_insol'] > 0.36 && planet['koi_insol'] < 1.11
        && planet['koi_prad'] < 1.6;
}

function loadPlanetsData() {
    return new Promise ((resolve, reject) => {
        fs.createReadStream(path.join(__dirname, '..', '..', 'data', 'kepler_data.csv'))
        .pipe(parse({
            comment: '#',
            columns: true
        }))
        .on('data', (data) => {
            if (isHabitablePlanet(data)){
                savePlanet(data)
            }
        })
        .on('error', (err) => {
            console.log('ERROR', err);
            reject(err);
        })
        .on('end', async () => {
            const numOfPlanets = (await getAllPlanets()).length;
            console.log(`${numOfPlanets} habitable planets`);
            resolve();
        });
    });
}

async function getAllPlanets() {
    return await planets.find({}, {
        '_id': 0,
        '__v': 0
    });
}

async function savePlanet(planet) {
    try {
        await planets.updateOne({
            keplerName: planet.kepler_name
        }, {
            keplerName: planet.kepler_name
        },{
            upsert: true
        });
    } catch(err) {
        console.error(`could not save a plant ${err}`);
    }
}
module.exports = {
    loadPlanetsData,
    getAllPlanets
}