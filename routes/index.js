var express = require('express');
var router = express.Router();


router.get('/', function(req, res, next) {
	res.render('index', { title: 'Return Request Demo' });
});

router.post('/', (req, res) => {
	console.log('request params: ', JSON.stringify(req.params));
	res.io.to(req.params.id).emit('viewerschanged', { id: req.params.id});
	res.send({status: 'ok'});
});

module.exports = router;
