const multer = require('multer');
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');
aws.config.loadFromPath(__dirname + '/awsconfig.json');
const s3 = new aws.S3();

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'sopt.seongjin.com',
        acl: 'public-read',
        key: function(req, file, cb) {
            console.log(`originalname:${file.originalname}`);
            cb(null, Date.now() + '_' + file.originalname);
        }
    })
});

module.exports = upload;