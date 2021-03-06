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

var config = require("./config.json"),
    os = require("os"),
    http = require("http"),
    proc = require("child_process"),
    port = config.listenerPort,
    supportedHooks = Object.keys(config.hooks),
    fnProcessRequest,
    fnVerifyMatches,
    server;

/**
 * This method verifies conditions given in config[<hook_type>].matches against requestBody
 */
fnVerifyMatches = function(requestBody, matchesCollection) {
    var matchItem;

    for (matchItem in matchesCollection)
    {
        if (!requestBody.hasOwnProperty(matchItem))
            return false;
        else
        {
            if (requestBody[matchItem] === matchesCollection[matchItem])
                continue;
            else
                return false;
        }
    }

    return true;
};

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

    hookConfig = config.hooks[object_kind];
    if (typeof hookConfig.matches === "object") // Check if 'matches' map is provided with this hook type.
        satisfiesMatches = fnVerifyMatches(requestBody, hookConfig.matches); // Verify matches.
    else
        satisfiesMatches = true;

    // Run commandBatch only if matches are satisfied.
    if (satisfiesMatches)
    {
        // Beware, this is DANGEROUS.
        commandBatch = proc.spawn(hookConfig.commandBatch);

        // Collect Bash output.
        commandBatch.stdout.on('data', function(data) {
            pipedOutput.push(data);
        });

        // Collect Bash errors.
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

    request
    .on('data', function(chunk) {
        reqBody.push(chunk);
    })
    .on('end', function() {
        reqBody = JSON.parse(Buffer.concat(reqBody).toString());

        // Check if
        // x-gitlab-event header is present in headers AND
        // object_kind is one of the supported hooks in config
        // then respond accordingly.
        if (reqHeaders.hasOwnProperty('x-gitlab-event') &&
            supportedHooks.indexOf(reqBody.object_kind) > -1)
        {
            response.statusCode = 200;
            fnProcessRequest(reqBody);
        }
        else
            response.statusCode = 400;

        response.end();
    });
});

server.listen(port, function() {
    console.info("%s started on %s:%d at %s",
        config.serverTitle,
        os.hostname(),
        port,
        new Date()
    );
});
