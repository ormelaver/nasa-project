const { 
    scheduleNewLaunch, 
    getAllLaunches, 
    abortLaunch,
    isLaunchExists } = require('../../models/launches.model');

const { 
    getPagination 
} = require('../../services/query');

async function httpGetAllLaunches (req, res) {
    const { skip, limit } = getPagination(req.query);
    const launches = await getAllLaunches(skip, limit);
    return res.status(200).json(launches);
}

async function httpSubmitLaunch (req, res) {
    const launch = req.body;
    if (!launch.mission || !launch.rocket || !launch.target || !launch.launchDate) {
        return res.status(400).json({
            error: 'missing required launch property'
        })
    }
    launch.launchDate = new Date(launch.launchDate);
    if (isNaN(launch.launchDate)) {
        return res.status(400).json({
            error: 'invalid launch date'
        })
    }
    await scheduleNewLaunch(launch)
    return res.status(201).json(launch);
}

async function httpAbortLaunch(req, res) {
    const launchId = Number(req.params.id);

    const existsLaunch = await isLaunchExists(launchId)
    if (!existsLaunch) {
        return res.status(404).json({
            error: 'Launch not found'
        });
    } 

    const aborted = await abortLaunch(launchId);
    if (!aborted) {
        return res.status(400).json({
            error: 'launch not aborted'
        })
    }
    return res.status(200).json({
        ok: true
    });  
}
module.exports = {
    httpGetAllLaunches,
    httpSubmitLaunch,
    httpAbortLaunch
}

// enhancements: implement validation with ajv npm package