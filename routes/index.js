var express = require('express');
var router = express.Router();
var bodyparser = require('body-parser');
var jsonparser = bodyparser.json();


router.get('/', function(req, res, next) {
	res.render('index', { title: 'Return Request Demo' });
});

router.post('/', (req, res) => {
	console.log('request params: ', JSON.stringify(req.query));
	res.io.to(req.query.id).emit('viewerschanged', { id: req.query.id});
	res.send({status: 'ok'});
});

module.exports = router;
