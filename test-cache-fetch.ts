import { angelOneClient } from './features/angelone/angelOneClient';
const fromDate = new Date(); fromDate.setFullYear(fromDate.getFullYear() - 1);
const toDate = new Date();
angelOneClient.getHistoricalDaily('BANKBARODA', fromDate, toDate).then(bars => console.log('Bars:', bars.length)).catch(console.error);
