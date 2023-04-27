const qrcode = require('qrcode-terminal');
const { Client, RemoteAuth } = require('whatsapp-web.js');
const moment = require('moment');
const mongoose = require('mongoose');
const { MongoStore } = require('wwebjs-mongo');
const supabase = require('../config/supabase.config');

const createSession = async () => {
  mongoose.connect(process.env.MONGODB_URI).then(() => {
    const store = new MongoStore({ mongoose });
    const client = new Client({
      puppeteer: { executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] },
      // eslint-disable-next-line no-undef
      authStrategy: new RemoteAuth({
        store,
        backupSyncIntervalMs: 300000,
        clientId: 'node-budgetBuddy-bot',
      }),
    });

    client.setMaxListeners(0);

    client.on('qr', (qr) => {
    // eslint-disable-next-line no-console
      console.log(qr);
      qrcode.generate(qr, { small: true });
    });

    client.on('disconnected', () => {
      // eslint-disable-next-line no-console
      console.log('Oh no! Client is disconnected!');
    });

    client.on('ready', () => {
    // eslint-disable-next-line no-console
      console.log('Client is ready!');
    });

    client.on('remote_session_saved', () => {
    // eslint-disable-next-line no-console
      console.log('Session Remote Saved!');
    });

    client.on('message', async (message) => {
      try {
        const tokenMessage = message.body.split(' ');
        const command = tokenMessage.shift();
        const args = tokenMessage;

        switch (command) {
          case 'in':
          case 'out': {
            const { error } = await supabase.from('transaction').insert({
              amount: args.shift(),
              detail: args.join(' '),
              typeId: command === 'in' ? 1 : 2,
              userId: message.from,
            });

            if (error) throw error;

            client.sendMessage(
              message.from,
              `Berhasil menyimpan data ${
                command === 'in' ? 'transaksi masuk' : 'transaksi keluar'
              }`,
            );
            break;
          }
          case 'list': {
            let queryType = 'Daftar Transaksi';
            const page = args.includes('page')
              ? args[args.indexOf('page') + 1]
              : 1;
            const limit = args.includes('limit')
              ? args[args.indexOf('limit') + 1]
              : 10;

            const query = supabase
              .from('transaction')
              .select('id, amount, detail, typeId, date');

            if (['in', 'out'].some((element) => args.includes(element))) {
              if (args.includes('in')) {
                queryType += ' Masuk';
                query.eq('typeId', 1);
              } else {
                queryType += ' Keluar';
                query.eq('typeId', 2);
              }
            }

            query.range((page - 1) * limit, page * limit - 1);

            query.order('date', {
              ascending: !!args[args.indexOf('order') + 1],
            });

            query.eq('userId', message.from);

            const { data, error } = await query;

            if (error) throw error;

            if (data.length === 0) {
              client.sendMessage(message.from, 'Data tidak ditemukan');
              break;
            }

            const response = () => {
              let result = '';
              result += `*${queryType}* \n`;

              data.forEach((element, index) => {
                const no = index + 1 + (page - 1) * limit;
                result += `${no < 10 ? `0${no}` : no}. ${
                  element.typeId === 1 ? '📈' : '📉'
                } ${moment(element.date)
                  .locale('id')
                  .format('|DD MMMM YY, HH:mm|')} ${element.amount} ${
                  element.detail
                }  \n`;
              });
              return result;
            };

            client.sendMessage(message.from, `${response()}`);
            break;
          }
          default:
            break;
        }
      } catch (error) {
      // eslint-disable-next-line no-console
        console.log('error', error);
      }
    });
    client.initialize();
  });
};

module.exports = {
  createSession,
};
