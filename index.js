const axios = require('axios');

const ax = axios.create({
    baseURL: 'https://api-seller.ozon.ru',
    headers: {
        'Client-Id': process.env.CLIENT_ID,
        'Api-Key': process.env.API_KEY,
        'Content-Type': 'application/json'
    }
});

setInterval(async ()=>{
    const postings = await getNewPostings();
    if(postings.length > 0) await packagePostings(postings);
}, 1000 * 30);

async function getNewPostings(){

    let offset = 0, postings = [];

    while(true){
        try{
            const res = await ax.post('/v2/posting/fbs/list', {
                dir: 'asc',
                filter: { status: 'awaiting_packaging' },
                limit: 50,
                offset
            });

            postings = postings.concat(res.data.result);

            if(res.data.result.length !== 50) break;
            offset += 50;

        }catch (e) {
            console.log(e.message);
        }
    }

    return postings;
}

async function packagePostings(postings){
    for(let posting of postings){
        let items = []
        for(let product of posting.products){
            const {sku, quantity} = product;
            items.push({sku: parseInt(sku), quantity});
        }
        try{
            const res = await ax.post('/v2/posting/fbs/ship', {
                packages: [{items}],
                posting_number: posting.posting_number
            });
            console.log('Package: ' + res.data.result[0])
        }catch (e) {
            console.log(e.message);
        }
    }
}