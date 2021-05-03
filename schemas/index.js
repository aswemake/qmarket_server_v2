const mongoose = require('mongoose');

module.exports = async () => {
    try {
        const connect = async () => {
            try {
                if (process.env.NODE_ENV !== 'production') {
                    mongoose.set('debug', true)
                }
                mongoose.set('useCreateIndex', true)
                await mongoose.connect(process.env.MONGODB_CONNECT_URL, 
                {
                    useNewUrlParser: true,
                    user: process.env.MONGODB_USERID,
                    pass: process.env.MONGODB_PASSWORD,
                    dbName: process.env.MONGODB_DBNAME,
                    useUnifiedTopology : true
                })
                console.log('몽고디비 연결 성공');
            } catch (err) {  
                console.log('몽고디비 연결 에러', err);
            }
        }
        connect();
        // mongoose.connection.on('error', (error) => {
        //     console.log('몽고디비 연결 에러', error);
        // });
        // mongoose.connection.on('disconnected', () => {
        //     console.error('몽고디비 연결이 끊겼습니다. 연결을 재시도합니다.');
        //     connect();
        // });

        require('./category');
        require('./coupon');
        require('./coupon_user');
        require('./party');
        require('./question');
        require('./answer');
        require('./product');
        require('./mission');
        require('./location');
        require('./feed');
        require('./banner');
        require('./like');
        require('./mission_admin');
        require('./review');
        require('./hashtag');
        require('./ticket');
        require('./benefit');
        require('./benefit_user');
        require('./notification');
        require('./enroll_party');
        require('./search_data');
        require('./purchasable_location');
        require('./partner');
        require('./category_v2');
        require('./address_matching');
        //require('./qna');

    } catch (err) {
        console.log(err);
    }
}