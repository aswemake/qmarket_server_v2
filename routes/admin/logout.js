var express = require('express');
var router = express.Router();

router.get('/', async (req, res) => {
    res.clearCookie("user_idx");
    console.log("로그아웃 : " + req.signedCookies.user);
    res.redirect('/start');
})
module.exports = router;