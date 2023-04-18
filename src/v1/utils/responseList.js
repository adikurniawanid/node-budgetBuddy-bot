const moment = require('moment');

module.exports = (data, params) => {
  let result = '';
  result += `*${params.queryType}* \n`;

  data.forEach((element, index) => {
    const no = index + 1 + (params.page - 1) * params.limit;
    result += `${no < 10 ? `0${no}` : no}. ${
      element.typeId === 1 ? '📈' : '📉'
    } ${moment(element.date).locale('id').format('|DD MMMM YY, HH:mm|')} ${
      element.amount
    } ${element.detail}  \n`;
  });
  return result;
};
