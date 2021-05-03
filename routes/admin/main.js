var express = require('express');
var router = express.Router();

router.get('/', async (req, res) => {
    if (req.signedCookies.user) {
        var user = req.signedCookies.user;
        console.log(`user: ${user}`);
        res.render('main', { user });
    } else {
        res.redirect('./start');
    }
})
module.exports = router;