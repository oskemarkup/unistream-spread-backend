const express = require('express');
const router = express.Router();
const axios = require('axios');

const getBinanceRate = payType => axios.post('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search', {
    proMerchantAds: false,
    page: 1,
    rows: 10,
    payTypes: [ payType ],
    countries: [],
    publisherType: null,
    asset: 'USDT',
    fiat: 'RUB',
    tradeType: 'BUY',
});

const unistreamUrl = 'https://online.unistream.ru/card2cash/calculate?payout_type=cash&destination=TUR&amount=4600&currency=USD&accepted_currency=RUB&profile=unistream_front&promo_id=445859%0D%0A';

/* GET users listing. */
router.get('/', function(req, res, next) {
    const raifRatePromise = getBinanceRate('RaiffeisenBank');
    const sberRatePromise = getBinanceRate('RosBankNew');
    const tinkRatePromise = getBinanceRate('TinkoffNew');
    const unistreamRatePromise = axios.get(unistreamUrl);

    Promise.all([ raifRatePromise, sberRatePromise, tinkRatePromise, unistreamRatePromise ])
        .then(([
                   { data: raifResponse },
                   { data: sberResponse },
                   { data: tinkResponse },
                   { data: unistreamResponse },
               ]) => {
            res.json({
                raif: Number(raifResponse.data[0].adv.price),
                sber: Number(sberResponse.data[0].adv.price),
                tink: Number(tinkResponse.data[0].adv.price),
                uni: unistreamResponse.fees[0].acceptedAmount / unistreamResponse.fees[0].withdrawAmount,
            });
        });
});

module.exports = router;
