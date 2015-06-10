var path = require('path'),
    express = require('express'),
    routes = require(__dirname + '/app/routes.js'),
    app = express(),
    port = (process.env.PORT || 3000),
    serverRequest = require('request'),

// Grab environment variables specified in Procfile or as Heroku config vars
    username = process.env.USERNAME,
    password = process.env.PASSWORD,
    submitEvidenceUrl = process.env.BACKEND_SUBMIT_URL || 'http://localhost:9292/submitEvidence'
    env = process.env.NODE_ENV || 'development';

// Authenticate against the environment-provided credentials, if running
// the app in production (Heroku, effectively)
if (env === 'production') {
  if (!username || !password) {
    console.log('Username or password is not set, exiting.');
    process.exit(1);
  }
  app.use(express.basicAuth(username, password));
}

// Application settings
app.engine('html', require(__dirname + '/lib/template-engine.js').__express);
app.set('view engine', 'html');
app.set('vendorViews', __dirname + '/govuk_modules/govuk_template/views/layouts');
app.set('views', __dirname + '/app/views');

// Middleware to serve static assets
app.use('/public', express.static(__dirname + '/public'));
app.use('/public', express.static(__dirname + '/govuk_modules/govuk_template/assets'));
app.use('/public', express.static(__dirname + '/govuk_modules/govuk_frontend_toolkit'));

app.use(express.favicon(path.join(__dirname, 'govuk_modules', 'govuk_template', 'assets', 'images','favicon.ico'))); 


// send assetPath to all views
app.use(function (req, res, next) {
  res.locals({'assetPath': '/public/'});
  next();
});


// routes (found in app/routes.js)

routes.bind(app);

// auto render any view that exists

app.get(/^\/([^.]+)$/, function (req, res) {

	var path = (req.params[0]);

	res.render(path, function(err, html) {
		if (err) {
			console.log(err);
			res.send(404);
		} else {
			res.end(html);
		}
	});

});

/**
 * Read the JSON from the POST request.
 *
 * For now this just reads up to a maximum size (arbitrarily set to 10000k for now).
 * Returns
 *
 * @param req
 */
function readJsonFromRequest(req, completeCallback) {
    var content = '';
    var limit = 10000;

    req.on('data', function (data) {
        // Append data.
        if (content.length < limit) {
            content += data;
        } else {
            console.log('Content is too big, closing');
            req.close();
        }

    });

    req.on('end', function () {
        console.log('Got all the data, running callback');
        completeCallback(content);
    });
}

/**
 * Add a handler for POST requests to submit evidence.
 *
 * This makes a call to the server and then returns any response back to the client
 * TODO: This needs ALOT of tidying up!
 * TODO: This needs tests!
 * TODO: This needs someone competent to have written it!
 */
app.post('/submitEvidence', function(req, res) {
    console.log('Submitting evidence ...');

    readJsonFromRequest(req, function(bodyContent) {

        console.log('Submitting this body: ' + bodyContent);
        serverRequest.post({ url: submitEvidenceUrl, body: bodyContent }, function(err, serverRes, serverBody) {

            if(!err) {
                console.log('Server return code: ' + serverRes.statusCode);
                console.log('Server body: ' + serverBody);
                res.send('All worked!');

            } else {
                console.log('Error submitting evidence: ' + err);
                res.send('Error connecting to server: ' + err);
            }

        });
    });

    console.log()
});

console.log('The App object: ' + app);
console.log('The App Stack: ' + app.stack);

// start the app

app.listen(port);
console.log('');
console.log('Listening on port ' + port);
console.log('');
