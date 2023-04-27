const { google } = require('googleapis');
const moment = require('moment');
const supabase = require('../config/supabase.config');
require('dotenv').config();

const writeToSpreadSheet = async () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APIS_KEYFILE,
    scopes: 'https://www.googleapis.com/auth/spreadsheets',
  });

  const client = await auth.getClient();
  const googleSheet = google.sheets({ version: 'v4', auth: client });

  const { data, error } = await supabase
    .from('transaction')
    .select('id, amount, typeId, detail, date')
    .order('date', {
      ascending: true,
    });

  if (error) throw error;

  const values = data.map((element) => [element.id, moment(element.date).locale('id')
    .format('dddd, DD MMMM YY, HH:mm'), element.detail, element.amount, element.typeId === 1 ? 'Dana Masuk' : 'Dana Keluar']);

  const resource = {
    values,
  };

  const inputSheet = await googleSheet.spreadsheets.values.append(
    {
      spreadsheetId: process.env.GOOGLE_APIS_SPREADSHEET_ID,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      resource,
    },
  );

  if (!inputSheet) {
    // eslint-disable-next-line no-console
    console.log('Error');
  }

  // eslint-disable-next-line no-console
  console.log(
    '%d cells updated on range: %s',
    inputSheet.data.updates.updatedCells,
    inputSheet.data.updates.updatedRange,
  );
};

module.exports = writeToSpreadSheet;
