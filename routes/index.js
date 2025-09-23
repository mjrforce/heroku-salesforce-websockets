var express = require('express');
var router = express.Router();


router.get('/', function(req, res, next) {
	res.render('index', { title: 'Return Request Demo' });
});

router.post('/addviewer', (req, res) => {
	res.io.to(req.params.id).emit('addviewer', { name: req.params.name});
});

router.post('/removeviewer', (req, res) => {
	res.io.to(req.params.id).emit('removeviewer', { name: req.params.name });
});

module.exports = router;
