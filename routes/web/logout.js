var express = require('express');
var router = express.Router();

router.get('/', async (req, res) => {
    res.clearCookie("user");
    console.log("๋ก๊ทธ์์ : " + req.signedCookies.user);
    res.redirect('/start');
})
module.exports = router;
