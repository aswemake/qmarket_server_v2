const mariadb = require('mariadb');

const pool = mariadb.createPool({
    host: 'readyforbox.cvrjbenzccpt.ap-northeast-2.rds.amazonaws.com', 
    port: 3307,
    user: 'getreadysetgo', 
    password: 'thstndud12',
    database: 'whatsubq-server',
    dateStrings: 'date'
});


module.exports = pool;
