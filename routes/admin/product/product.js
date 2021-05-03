var express = require('express');
var router = express.Router();

router.get('/', async (req, res) => {
    if (req.signedCookies.user) {
        var user_idx = req.signedCookies.user;
        console.log(user_idx);
        res.render('product', { user_idx });
    } else {
        res.redirect('../start');
    }
})
module.exports = router;