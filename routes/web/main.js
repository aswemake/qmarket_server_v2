var express = require('express');
var router = express.Router();

router.get('/', async (req, res) => {
    if (req.signedCookies.user) {
        var user = req.signedCookies.user;
        console.log(`user: ${user}`);
        if(user[2] === "admin") {
            res.render('admin/main', { user });
        } else if(user[2] === "manager") {  
            res.render('manager/main', { user });
        } else if(user[2] === "rider") {  
            res.render('rider/main', { user });
        }
    } else {
        res.redirect('./start');
    }
})
module.exports = router;