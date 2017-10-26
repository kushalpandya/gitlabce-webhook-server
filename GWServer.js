/**
 * GitLab CE Webhook Server v0.1.0
 * GitLab CE local Webhook Server based on NodeJS to
 * trigger some tasks when repo is updated.
 * start this server by running `node GWServer.js`
 *
 *
 * Author: Kushal Pandya <kushalspandya@gmail.com> (https://doublslash.com)
 * Date: 23 May, 2016
 * License: MIT
 *
 * Main Server Script.
 */

var config = require("./config.js"),
	_ = require("./lookup.js"),
	os = require("os"),
	fs = require("fs"),
	path = require("path"),
	http = require("http"),
	proc = require("child_process"),
	port = config.listenerPort,
	host = (config.hasOwnProperty("hostname") && config.hostname != null) ? config.hostname : os.hostname(),
	supportedHooks = Object.keys(config.hooks),
	fnProcessRequest,
	fnVerifyMatches,
	server;


/**
 * This method walks through the config.hooks to validate correct
 * execute permission on the command line scripts.
 */
fnValidateConfig = function(sH) {
	for (var i = 0; i < sH.length; i++) {
		// read properties from config.js
		file = _.lookup(config.hooks, sH[i] +".commandBatch");
		loc  = _.lookup(config.hooks, sH[i] + ".commandDir");

		// gynmastics to create a file path
		loc = loc == null ? "" : loc;
		file = path.join(loc, file);

		// check if we can execute this file.
		try {
			fs.accessSync(file, 
			    fs.constants.F_OK | fs.constants.R_OK | 
		            fs.constants.X_OK);
		} catch (e) {
			console.log("Missing file or execute permissions on file: " + file);
			console.log("Recommend running chmod +x " + file);
			// exiting hard with a big bad error
			process.exit();
		}
	}
};


/**
 * This method verifies conditions given in config[<hook_type>].matches against requestBody
 */
fnVerifyMatches = function(requestBody, matchesCollection) {
	var matchItem;

	for (matchItem in matchesCollection)
	{
		console.log("match: " + matchItem + 
		    " value: " + _.lookup(requestBody, matchItem) + 
		    " compare to: " + matchesCollection[matchItem]);

		if (matchesCollection[matchItem] === _.lookup(requestBody,matchItem) )
			continue;
		else
			return false;
	}

	return true;
};


fnCheckRequest = function(reqHeaders, type) {

	var token, secretKey;

	if ( reqHeaders.hasOwnProperty('x-gitlab-token') ) {
		token = reqHeaders['x-gitlab-token'];
	}
	else {
		return false;
	}

	if (reqHeaders.hasOwnProperty('x-gitlab-event') &&
		supportedHooks.indexOf(type) > -1)
	{
		secretKey = config.hooks[type]["secretKey"];
	}
	else {
		return false;
	}
	
	if ( token === secretKey ) {
		//console.info("token = %s, secretKey = %s", token, secretKey);
		return true;
	}

	return false;
}

/**
 * This method does all the processing and command execution on requestBody.
 */
fnProcessRequest = function(requestBody) {
	var object_kind = requestBody.object_kind,
		satisfiesMatches = false,
		pipedOutput = [],
		errors = [],
		commandBatch,
		hookConfig,
		i;

	// retrieve the configuration for this hook-type.
	hookConfig = config.hooks[object_kind];
	
	// Check if 'matches' map is provided with this hook type.
	if (typeof hookConfig.matches === "object") {
		// Verify matches - run comparisons.
		satisfiesMatches = fnVerifyMatches(requestBody, hookConfig.matches);
	}
	else {
		// no "matches" map in config.js; skip comparison; satisfies = true
		satisfiesMatches = true;
	}

	console.info("match %s at %s", satisfiesMatches, new Date());

	// Run commandBatch only if matches are satisfied.
	if (satisfiesMatches)
	{
		console.info("running %s at %s", 
		    hookConfig.commandBatch, new Date());

		options = {
			"cwd": _.lookup(hookConfig, "commandDir")
		};

		// Beware, this is DANGEROUS.
		commandBatch = proc.spawn(hookConfig.commandBatch, 
		    options);

		// Collect command output.
		commandBatch.stdout.on('data', function(data) {
			pipedOutput.push(data);
		});

		// Collect command errors.
		commandBatch.stderr.on('data', function(data) {
			errors.push(data);
		});

		// Listen for end of commandBatch execution.
		commandBatch.on('exit', function(status) {
			if (status === 0) // Check if execution failed with non-Zero status
				console.log(Buffer.concat(pipedOutput).toString()); // All good.
			else
				console.error('Hook Execution Terminated with status : %s \n', status, Buffer.concat(errors).toString());
		});
	}
};

server = http.createServer(function(request, response) {
	var reqHeaders = request.headers,
		reqBody = [];

	//console.log(request.method);
	if (request.method == 'GET') {
		response.statusCode = 404;
		response.end();
		return;
	}

	request
	.on('data', function(chunk) {
		reqBody.push(chunk);
	})
	.on('end', function() {
		reqBody = JSON.parse(Buffer.concat(reqBody).toString());

		//
		// Check if
		// x-gitlab-event header is present in headers 
		// AND object_kind is one of the supported hooks in config.js
		// AND x-gitlab-token matches the secretKey in config.js
		// then respond accordingly.
		//
		if ( fnCheckRequest(reqHeaders, reqBody.object_kind) )
		{
			console.info("fnCheckRequest passed");
			response.statusCode = 200;
			fnProcessRequest(reqBody);
		}
		else {
			console.info("fnCheckRequest failed");
			response.statusCode = 400;
		}

		response.end();
	});
});


/*
 * function to look through config.js to verify execute permissions
 * on all "commandBatch" files.
 */
fnValidateConfig(supportedHooks);


/*
 * begin nodejs httpd server listening on specified ports/hostnames.
 */
server.listen(port, host, function() {
	console.info("%s started on %s:%d at %s",
		config.serverTitle,
		host,
		port,
		new Date()
	);
});
