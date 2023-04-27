/* eslint-disable import/no-extraneous-dependencies */
const cron = require('node-cron');
const writeToSpreadSheet = require('./googleSheet.util');

cron.schedule('59 23 * * *', async () => {
  await writeToSpreadSheet();
});
