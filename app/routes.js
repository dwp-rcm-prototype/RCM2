
module.exports = {
  bind : function (app) {

    app.use(function(req, res, next) {
      if (req.path.substr(-1) === '/' && req.path.length > 1) {
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
      res.redirect('rcm/report-benefit-fraud');
    });
    app.get('/rcm/report-benefit-fraud', function (req, res) {
      res.render('rcm/report-benefit-fraud');
    });
    app.get('/rcm/dummy', function (req, res) {
      res.render('rcm/dummy');
    });

    // 1. Identify suspect
    app.post('/rcm/identify-suspect', function (req, res) {
      res.render('rcm/identify-suspect', {
        'previousPage': 'index'
      });
    });

    // 2. Type of fraud
    app.get('/rcm/type-of-fraud', function (req, res) {
      res.render('rcm/type-of-fraud', {
        'previousPage': 'identify-suspect'
      });
    });


    // 3. Identify partner
    app.post('/rcm/identify-partner', function (req, res) {
      res.render('rcm/identify-partner', {
        'previousPage': 'type-of-fraud'
      });
    });

    // 4. Employment prompt
    app.post('/rcm/employment-prompt', function (req, res) {
      res.render('rcm/employment-prompt', {
        'previousPage': 'identify-partner'
      });
    });

    // 5. employment suspect
    app.post('/rcm/employment-suspect', function (req, res) {
      res.render('rcm/employment-suspect', {
        'previousPage': 'employment-prompt'
      });
    });

    // 6. employment partner
    app.post('/rcm/employment-partner', function (req, res) {
      res.render('rcm/employment-partner', {
        'previousPage': 'employment-prompt'
      });
    });

    // 6. employment suspect + partner
    app.post('/rcm/employment-suspect-and-partner', function (req, res) {
      res.render('rcm/employment-suspect-and-partner', {
        'previousPage': 'employment-prompt'
      });
    });

    // 8. Vehicle
    app.post('/rcm/vehicle', function (req, res) {
      res.render('rcm/vehicle', {
        'previousPage': 'javascript:window.history.back()',
        'nextPage': 'other-information'});
    });

    // 9. Other information
    app.post('/rcm/other-information', function (req, res) {
      res.render('rcm/other-information', {
        'previousPage': 'vehicle',
        'nextPage': 'complete'});
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
    app.get('/rcm/showcase/identify-suspect-alternatives', function (req, res) {
      res.render('rcm/showcase/identify-suspect-alternatives', {'previousPage': '/rcm/showcase'});
    });






  }
};


