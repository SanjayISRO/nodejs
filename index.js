const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const Port = 8080;
const app = express();
const fs = require('fs');
let path = require('path');


app.use(bodyParser.json());
app.use(cors());

app.use('/', express.static(path.join(__dirname, 'ui/dist/my-app')))

app.get('/getUsersList', (req, response) => {
    const result = getFile('./data/usersList.json');
    response.status(200).send(responseObj(filterActiveResults(result)));
});

app.post('/saveUserData', (req, response) => {
    let result = getFile('./data/usersList.json');
    req.body.details.id = result[req.body.category].length + 1;
    result[req.body.category].unshift(req.body.details)
    fs.writeFileSync('./data/usersList.json', JSON.stringify(result, null, "\t"));
    response.status(200).send(responseObj(filterActiveResults(result)));
});

app.put('/deleteUser', (req, response) => {
    let result = getFile('./data/usersList.json');
    const usersList = result[req.body.category];
    for (let i = 0; i < usersList.length; i++) {
        if (usersList[i]['id'] === req.body.rowId) {
            usersList[i]['isActive'] = false;
        }
    }
    fs.writeFileSync('./data/usersList.json', JSON.stringify(result, null, "\t"));
    response.status(200).send(responseObj(filterActiveResults(result)));
});

app.get('/faqs', (req, response) => {
    const result = getFile('./data/faqs.json');
    response.status(200).send(responseObj(result));
});

app.get('/getConfigData', (req, response) => {
    const result = getFile('./data/config.json');
    response.status(200).send(responseObj(result));
});

app.post('/saveFormData', (req, response) => {
    let result = getFile('./data/registrationForm.json');
    if (!result.hasOwnProperty(req.body.eventName)) {
        result[req.body.eventName] = [];
    }
    result[req.body.eventName].push(req.body.details);
    fs.writeFileSync('./data/registrationForm.json', JSON.stringify(result, null, "\t"));
    response.status(200).send(responseObj(result));
});

app.post('/listOfTeamNames', (req, response) => {
    let result = getFile('./data/registrationForm.json');
    result = result.hasOwnProperty(req.body.eventName) ? listOfTeamNames(result[req.body.eventName]) : [];
    response.status(200).send(responseObj(result));
});

app.post('/getRegisteredUsers', (req, response) => {
    const result = getFile('./data/registrationForm.json');
    response.status(200).send(responseObj(result[req.body.eventName]));
});

app.post('/validateUser', (req, response) => {
    const result = getFile('./data/adminUsers.json');
    let isValidUser = false;
    for (const user of result) {
        if ((user.name === req.body.name || user.email === req.body.name) && user.password === req.body.password) {
            isValidUser = true;
            break;
        }
    }
    if (isValidUser) {
        response.status(200).send(responseObj(sendRegisteredListData(true)));
        return;
    }
    response.status(200).send(errResponseObj('User Access Denied'));
});

app.post('/getEditDetails', (req, response) => {
    let result = getFile('./data/registrationForm.json');
    result = result[req.body.eventName];
    for (const details of result) {
        if (details.teamName.toLowerCase() === req.body.teamName.toLowerCase() &&
            details.secretKey === req.body.secretKey) {
            response.status(200).send(responseObj(details));
            return;
        }
    }
    response.status(200).send(errResponseObj('No data found'));
});

app.put('/saveEditedFormData', (req, response) => {
    let result = getFile('./data/registrationForm.json');
    let eventResult = result[req.body.eventName];
    for (let i = 0; i < eventResult.length; i++) {
        if (eventResult[i].teamName === req.body.details.teamName) {
            eventResult[i] = req.body.details;
            break;
        }
    }
    fs.writeFileSync('./data/registrationForm.json', JSON.stringify(result, null, "\t"));
    response.status(200).send(responseObj(result));
});

app.put('/saveDataForConnectEdit', (req, response) => {
    let result = getFile('./data/usersList.json');
    let eventResult = result['connect'];
    let data;
    for (let eResult of eventResult) {
        if (eResult.id === req.body.id) {
            for(let key in req.body.details) {
                eResult[key] = req.body.details[key];
            }
            data = eResult;
            break;
        }
    }
    if (req.body.details.status.toLowerCase() === 'closed') {
        result['connect'] = result['connect'].filter(e => e.id !== req.body.id);
        let closedResults = getFile('./data/closedProblemStatement.json');
        data.isActive = false;
        closedResults['connect'].push(data);
        fs.writeFileSync('./data/closedProblemStatement.json', JSON.stringify(closedResults, null, "\t"));
    }
    fs.writeFileSync('./data/usersList.json', JSON.stringify(result, null, "\t"));
    response.status(200).send(responseObj(result));
});

app.get('/workshopVideos', (req, response) => {
    let result = getFile('./data/workshopVideos.json');
    response.status(200).send(responseObj(result));
});

app.get('/registeredList', (req, response) => {
    response.status(200).send(responseObj(sendRegisteredListData(false)));
});


function responseObj(resultData) {
    return {
        status: 200,
        data: resultData,
        message: 'success'
    }
}

function errResponseObj(resultData) {
    return {
        status: 200,
        data: resultData,
        message: 'error'
    }
}

function filterActiveResults(result) {
    const resultObj = {};
    for (let key in result) {
        resultObj[key] = [];
        for (let data of result[key]) {
            if (data['isActive']) {
                resultObj[key].push(data)
            }
        }
    }
    return resultObj;
}

function getFile(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function listOfTeamNames(data) {
    let listOfNames = [];
    data.forEach(e => listOfNames.push(e['teamName']));
    return listOfNames;
}

function sendRegisteredListData(flag) {
    let eventList = getFile('./data/config.json');
    return {
        eventList: eventList['registrationFormConfigs']['eventNames'],
        regsitrationDetails: getFile('./data/registrationForm.json'),
        isAdminUser: flag
    }
}

app.listen(process.argv[2] || Port, function () {
    console.log('server running on localhost: ' + (process.argv[2] || Port))
});