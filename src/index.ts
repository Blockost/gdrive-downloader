import axios from 'axios';
import * as CSV from 'csv-string';
import fs from 'fs';
import { google } from 'googleapis';
import { Config } from './constants';

// TODO: 2023-01-15 Simon Add logger and log to a file instead (or use events instead )!
// See https://stackoverflow.com/questions/53284918/how-to-log-from-a-npm-package-without-forcing-a-logging-library

export class GDriveDownloader {
    static readonly DEFAULT_CONFIG: Config = {
        fileId: '',
        sheetId: '',
        pathToCredentialsFile: './credentials.json',
        destinationFilePath: './',
        csvProcessingOptions: { targetSeparator: ',' }
    };

    async download(partialConfig: Partial<Config>): Promise<void> {
        const config = this.buildConfigWithDefault(partialConfig);

        // Build googleapis auth object
        const auth = new google.auth.GoogleAuth({
            keyFile: config.pathToCredentialsFile,
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });

        const accesstoken = await auth.getAccessToken();
        // XXX: 2023-01-15 Simon Use good old http request because we can't download a specific sheet from a Google spreadsheet in csv format...
        const url = `https://docs.google.com/spreadsheets/d/${config.fileId}/export?exportFormat=csv&gid=${config.sheetId}`;

        try {
            console.log('Downloading file...');
            const res = await axios.get(url, { headers: { 'Authorization': `Bearer ${accesstoken}` } })
            console.log('File successfully downloaded but not saved to disk yet. Processing...');

            let csvData = res.data as string;

            if (!csvData || csvData.length < 1) {
                console.log('File is empty. Returning...')
                return;
            }

            const originalDelimiter = CSV.detect(csvData);
            console.log('Original delimiter is', originalDelimiter);

            // Update csv separator (if necessary)
            const targetDelimiter = config.csvProcessingOptions?.targetSeparator;
            if (targetDelimiter && originalDelimiter !== targetDelimiter) {

                console.log('Target delimiter is', targetDelimiter);
                // Match delimiter except between quotes (escaping quotes allowed)
                // See https://stackoverflow.com/a/11503678
                const regex = new RegExp(`${originalDelimiter}(?=(?:(?:\\\\.|[^"\\\\])*"(?:\\\\.|[^"\\\\])*")*(?:\\\\.|[^"\\\\])*$)`, 'g')
                csvData = csvData.replace(regex, targetDelimiter);
                const newDelimiter = CSV.detect(csvData);
                console.log('New delimiter is', CSV.detect(csvData))

                if (newDelimiter !== targetDelimiter) {
                    throw new Error(`Expected delimiter '${targetDelimiter}' not set`)
                }
            }

            // Finally, write file to disk
            fs.writeFileSync(config.destinationFilePath, csvData);
            console.log(`File can be found at: ${config.destinationFilePath}`);
        } catch (error) {
            console.error(`An error occured: ${error}`);
            // Remove created file in case of error
            if (fs.existsSync(config.destinationFilePath)) {
                console.log('Deleting tmp file');
                fs.unlinkSync(config.destinationFilePath)
            }
        }
    }

    private buildConfigWithDefault(config: Partial<Config>): Config {
        return Object.assign({}, GDriveDownloader.DEFAULT_CONFIG, config);
    }
}
