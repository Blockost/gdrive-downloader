const { google } = require('googleapis');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const CSV = require('csv-string');

// TODO: 2023-01-15 Simon Add logger and log to a file instead!
// TODO: 2023-01-28 Simon Add config file (e.g., YAML)
// TODO: 2023-01-28 Simon Switch to Typescript 🚀

const targetDelimiter = ';';

const auth = new google.auth.GoogleAuth({
    // keyFile: path.join(__dirname, 'credentials.json'),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

(async () => {
    const accesstoken = await auth.getAccessToken();
    const fileId = '1q35rVmJzTWM0_cGSA6XcsZlTInZiKI8v9pz2yjAeRfw'
    const sheetId = '125068327'
    // XXX: 2023-01-15 Simon Use good old http request because we can't download a specific sheet from a Google spreadsheet in csv format...
    const url = `https://docs.google.com/spreadsheets/d/${fileId}/export?exportFormat=csv&gid=${sheetId}`;
    const destinationFilePath = path.join(__dirname, `${Date.now()}.csv`);

    try {
        console.log('Downloading file...')
        const res = await axios.get(url, { headers: { 'Authorization': `Bearer ${accesstoken}` } })
        console.log(`File successfully downloaded: ${destinationFilePath}`)

        let csvData = res.data;

        if (!csvData || csvData.length < 1) {
            console.log('File is empty. Returning...')
            return;
        }

        const originalDelimiter = CSV.detect(csvData);
        console.log('Original delimiter is', originalDelimiter);

        // Update csv separator (if necessary)
        if (originalDelimiter !== targetDelimiter) {
            const regex = new RegExp(originalDelimiter, 'g')
            csvData = csvData.replace(regex, targetDelimiter);
            const newDelimiter = CSV.detect(csvData);
            console.log('New delimiter is', CSV.detect(csvData))

            if (newDelimiter !== targetDelimiter) {
                throw new Error(`Expected delimiter '${targetDelimiter}' not set`)
            }
        }

        // Finally, write file to disk
        fs.writeFileSync(destinationFilePath, csvData);
    } catch (error) {
        console.error(`An error occured while downloading file. Error ${error}`);
        // Remove created file in case of error
        if (fs.existsSync(destinationFilePath)) {
            console.log('Deleting tmp file');
            fs.unlinkSync(destinationFilePath)
        }
    }
})();
