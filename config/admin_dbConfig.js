const mariadb = require('mariadb');

const admin_pool = mariadb.createPool({
    host: 'readyforbox.cvrjbenzccpt.ap-northeast-2.rds.amazonaws.com', 
    port: 3307,
    user: 'getreadysetgo', 
    password: 'thstndud12',
    database: 'whatsubq',
    dateStrings: 'date'
});


module.exports = admin_pool;
