var express = require('express');
var router = express.Router();
var bodyparser = require('body-parser');
var jsonparser = bodyparser.json();


router.get('/', function(req, res, next) {
	res.render('index', { title: 'Return Request Demo' });
});

router.post('/', jsonparser, (req, res) => {
	console.log('request params: ', JSON.stringify(req.body));
	res.io.to(req.body.id).emit('viewerschanged', { id: req.body.id});
	res.send({status: 'ok'});
});

module.exports = router;
