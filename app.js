const {
    google
} = require('googleapis');
require('dotenv').config();
const service = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});
const fs = require('fs');

//******IMPORTANT ********//
let isTesting = false; //set to true if you want to test the api

if (!isTesting) {
    getTrends('de', 100); //Germany
    getTrends('us', 100); //USA
    getTrends('at', 100); //Austria
    getTrends('ch', 100); //Switzerland
    getTrends('gb', 100); //Great Britain
    getTrends('fr', 100); //France
    getTrends('ca', 100); //Canada
    getTrends('in', 100); //India
    getTrends('es', 100); //Spain
    getTrends('it', 100); //Italy
    getTrends('au', 100); //Australia
} else {
    test_more()
    // testMissingDates();
    // deleteLastEntry()
    //stop the process after 100 seconds
    process.exit(0);
}

//stop the process after 100 seconds
setTimeout(() => {
    process.exit(0);
}, 100000);

async function getTrends(region, maxResults) {
    service.videos.list({
        part: 'snippet',
        chart: "mostPopular",
        regionCode: region,
        maxResults: maxResults,
    }, (err, response) => {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        const videos = response.data.items;
        if (videos.length == 0) {
            console.log('No videos found.');
        } else {
            let data = videos.map(video => {
                return {
                    id: video.id,
                    title: video.snippet.title,
                    categoryId: video.snippet.categoryId,
                    channelId: video.snippet.channelId,
                    channelTitle: video.snippet.channelTitle,
                    tags: video.snippet.tags,
                    // thumbnails: video.snippet.thumbnails ? .standard ? .url,
                    publishedAt: video.snippet.publishedAt
                };
            });
            let dataToStore = {
                date: new Date(),
                data
            };
            fs.writeFile(`./data/${region}/${getDate()}.json`, JSON.stringify(dataToStore), (err) => {
                if (err) throw err;
                console.log('Data written to file');
            });
            return data;
        }
    });
}

async function test(region, maxResults) {
    service.videos.list({
        part: 'snippet',
        chart: "mostPopular",
        regionCode: region,
        maxResults: maxResults,
    }, (err, response) => {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        const videos = response.data.items;
        if (videos.length == 0) {
            console.log('No videos found.');
        } else {
            console.log(videos[0]);
            // return data;
        }
    });
}

async function test_more(region, maxResults) {
    service.liveChatMessages.list({
        part: "snippet",
        liveChatId: ""
    }, (err, res) => {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        console.log(res);
    })
}

function testMissingDates() {
    let files = fs.readdirSync('./data/at');
    for (let i = 0; i <= files.length - 2; i++) {
        let date = new Date(files[i].split('.')[0].slice(0, 10));
        let nextDate = new Date(files[i + 1].split('.')[0].slice(0, 10));
        if (nextDate) {
            let diff = nextDate.getTime() - date.getTime();
            if (diff > 86400000) {
                console.log("Missing date: " + new Date(date.getTime() + 86400000).toISOString().slice(0, 10));
            }
        }
    }
}

function deleteLastEntry() {
    let folder = ['./data/de', './data/us', './data/at', './data/ch', './data/gb', './data/fr', './data/ca', './data/in', './data/es', './data/it', './data/au'];
    folder.forEach(folder => {
        let files = fs.readdirSync(folder);
        let lastFile = files[files.length - 1];
        fs.unlinkSync(`${folder}/${lastFile}`);
    })
}


function getDate() {
    let date = new Date();

    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let hour = date.getHours();
    let minute = date.getMinutes();
    let seconds = date.getSeconds();

    //get all numbers with starting 0 if below 10
    month = month < 10 ? '0' + month : month;
    day = day < 10 ? '0' + day : day;
    hour = hour < 10 ? '0' + hour : hour;
    minute = minute < 10 ? '0' + minute : minute;
    seconds = seconds < 10 ? '0' + seconds : seconds;

    return year + "-" + month + "-" + day + "-" + hour + "-" + minute + "-" + seconds;
}

module.exports = {
    getTrends
}