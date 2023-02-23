export interface Config {
    /**
     * ID of the Google Sheet file.
     */
    fileId: string;
    /**
     * Sheet ID. This is basically the ID of the tab to download
     */
    sheetId: string;
    /**
     * Path to credentials file.
     * 
     * See https://github.com/googleapis/google-api-nodejs-client#using-the-keyfile-property
     */
    pathToCredentialsFile: string;
    /**
     * Path to download csv file to.
     */
    destinationFilePath: string;
    /**
     * Options for CSV processing.
     */
    csvProcessingOptions?: CsvProcessingOptions;
}

export interface CsvProcessingOptions {
    /**
     * Special character to separate values in csv file.
     * 
     * This only supports common separator for now.
     * See https://www.npmjs.com/package/csv-string
     */
    targetSeparator: ',' | ';' | '|' | '\t';
}