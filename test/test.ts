import { GDriveDownloader } from '../src';

(async () => {
    await new GDriveDownloader().download({
        // Add additional config here
        destinationFilePath: './out.csv',
        csvProcessingOptions: {
            targetSeparator: ';'
        }
    });
})();
