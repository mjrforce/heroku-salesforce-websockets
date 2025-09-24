var express = require('express');
var router = express.Router();
var bodyparser = require('body-parser');
var jsonparser = bodyparser.json();


router.get('/', function(req, res, next) {
	res.render('index', { title: 'Return Request Demo' });
});

router.post('/', (req, res) => {
	console.log('request params: ', JSON.stringify(req.query));
	let payload = { id: req.query.id};
	console.log('payload: ' + JSON.stringify(payload));
	console.log('res.io:' + typeof res.io);
	res.io.to(req.query.id).emit('viewerschanged', payload);
	res.send({status: 'ok'});
});

module.exports = router;
