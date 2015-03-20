
module.exports = {
  bind : function (app) {

    app.use(function(req, res, next) {
      if (req.path.substr(-1) == '/' && req.path.length > 1) {
        var query = req.url.slice(req.path.length);
        res.redirect(301, req.path.slice(0, -1) + query);
      } else {
        next();
      }
    });

    app.get('/', function (req, res) {
      res.render('index');
    });

    // add your routes here
    app.get('/rcm', function (req, res) {
      res.render('rcm/index');
    });
    app.get('/rcm/dummy', function (req, res) {
      res.render('rcm/dummy');
    });
    app.get('/rcm/type-of-fraud', function (req, res) {
      res.render('rcm/type-of-fraud', {'previousPage': 'index'});
    });
    app.post('/rcm/identify-suspect', function (req, res) {
      res.render('rcm/identify-suspect', {'previousPage': 'type-of-fraud'});
    });
    app.post('/rcm/complete', function (req, res) {
      res.render('rcm/complete');
    });

    /* SHOWCASE ROUTES. These must be removed before going live */
    app.get('/rcm/showcase', function (req, res) {
      res.render('rcm/showcase/index', {'previousPage': '/rcm/index'});
    });
    app.get('/rcm/showcase/checkboxes', function (req, res) {
      res.render('rcm/showcase/checkboxes', {'previousPage': '/rcm/showcase'});
    });



  }
};


