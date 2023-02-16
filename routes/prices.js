const express = require('express');
const router = express.Router();
const axios = require('axios');

const getBinanceRate = (payTypes, amount) => axios.post('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search', {
    proMerchantAds: false,
    page: 1,
    rows: 15,
    payTypes,
    countries: [],
    publisherType: null,
    asset: 'USDT',
    fiat: 'RUB',
    tradeType: 'SELL',
    transAmount: amount,
});

const unistreamUrl = 'https://online.unistream.ru/card2cash/calculate?payout_type=cash&destination=TUR&amount=1000&currency=USD&accepted_currency=RUB&profile=unistream_front';
const unistreamPromoUrl = unistreamUrl + '&promo_id=445859%0D%0A';

const parseUni = data => Number((data.fees[0].acceptedAmount / data.fees[0].withdrawAmount).toFixed(4));

router.get('/unistream', function(req, res) {
    const unistreamRatePromise = axios.get(unistreamUrl);
    const unistreamPromoRatePromise = axios.get(unistreamPromoUrl);

    Promise.all([ unistreamRatePromise, unistreamPromoRatePromise ])
        .then(response => res.json([parseUni(response[0].data), parseUni(response[1].data)]));
});

const parseBinance = item => ({
    id: item.adv.advNo,
    rate: Number(item.adv.price),
    amount: Number(item.adv.surplusAmount),
    min: Number(item.adv.minSingleTransAmount),
    max: Number(item.adv.maxSingleTransAmount),
    isMerchant: item.advertiser.userType !== 'user',
    deals: item.advertiser.monthOrderCount,
    percentage: item.advertiser.monthFinishRate * 100,
    nickname: item.advertiser.nickName,
});

router.get('/binance', function(req, res) {
    const { bankNames, amount } = req.query;

    const banksMap = {
        sber: 'RosBankNew',
        raif: 'RaiffeisenBank',
        tink: 'TinkoffNew',
    };

    const banks = (Array.isArray(bankNames) ? bankNames : [bankNames])
        .reduce((acc, item) => !item in banksMap ? acc : [...acc, item], []);

    if (!banks.length || !amount) {
        return res.json([]);
    }

    getBinanceRate(banks, amount)
        .then(({ data }) => {
            res.json(data.data.map(parseBinance));
        });
});

module.exports = router;
