GitLab CE Webhook Server
======================

A simplest, configurable NodeJS-powered Webhook Server for your GitLab CE installation.

###What is a Webhook?
Short Answer: Webhook is an HTTP event that's fired when _something_ happens.
Long Answer: Read this [excellent explanation](https://webhooks.pbworks.com/).

###Why?
In order to _consume_ a webhook, you need a server that listens for such webhooks and such a task is usually handled by your "Continuous Integration Server".

If you have a behind-the-firewall server configured to run GitLab CE and do not have any CI (like [Travis CI](https://travis-ci.org/) or [GitLab CI](https://about.gitlab.com/gitlab-ci/)) configured then chances are that you're going to manage build and deployment after code change manually (which is not _recommended_). But, you do it anyway for several reasons like; you're evaluating GitLab CE within a small team before you migrate codebases there for full time use, or you do not want your code to be out in the wild, or you are brave enough to handle these tasks yourself.

GitLab CE Webhook Server or GWS is dead simple Node script which can run with minimal effort (and no external dependency) and can monitor events which are provided by GitLab CE Webhooks (as listed [here](https://gitlab.com/gitlab-org/gitlab-ce/blob/master/doc/web_hooks/web_hooks.md)) and perform tasks (actually bash/batch script) on those events.


###Configure
---
Download the tarball and extract it or clone the repo, and open `config.json` in your editor, provided file looks like this.
```json
{
    "serverTitle": "GitLab CE Webhook Server",
    "listenerPort": 10000,
    "hooks": {
        "push": {
            "matches": {
                "user_name": "Kushal Pandya"
            },
            "commandBatch": "./shellscript.sh"
        },
        "tag_push": {

        },
        "issue": {

        },
        "note": {

        },
        "merge_request": {

        }
    }
}
```
You can edit this file to match with your needs, as all the options that GWS supports are provided via this file. Once the file is edited to meet your requirements simply run `npm start` to launch the server. It'll show URL and port number that server is running on (eg; `GitLab CE Webhook Server started on http://yourhostname:10000 at <timestamp>`), you can than go to repository settings in your GitLab, then in Webhooks section, you can add this URL and select events that you want to invoke it for and click on "Add Webhook", like below.

![GitLab CE Repository Webhooks](http://i.imgur.com/Y4uDsbk.png)

###Options
---
- `serverTitle`: This is a title string that you want to keep, this will be shown when server is started from terminal.
- `listenerPort`: This is a port number where GWS will listen for Hook events by GitLab.
- `hooks`: This is the config where you provide conditions to match and scripts  to execute on every hook type. Note that keyname of hook is same as `object_type` provided by GitLab's Hook event `requestBody` (learn more [here](https://gitlab.com/gitlab-org/gitlab-ce/blob/master/doc/web_hooks/web_hooks.md)). It can be only be `push`, `tag_push`, `issue`, `note` or `merge_request`.
	- `matches`: This is where you can provide conditions to check before running your hook task. This config is optional in case you don't want to perform any evaluations before running `commandBatch`. See example section to learn how it works.
	- `commandBatch`: Provide path of bash script (`.sh`) or batch file (`.bat`) that you want to run for this hook when `matches` evaluates to true (if it is provided). Note that for bash scripts (in Mac and Linux), you need to precede the file path with `./` to make sure it is executable, eg; `./path/to/myscript.sh`.

###Example
---
In case of following configuration
```json
{
    "serverTitle": "My Boring CE Webhook Server",
    "listenerPort": 9000,
    "hooks": {
        "push": {
            "matches": {
                "user_name": "Kushal Pandya",
                "project_id": 15
            },
            "commandBatch": "./push_event_script.sh"
        },
        "tag_push": {
           "commandBatch": "./tag_event_script.sh"
	    },
        "issue": {

        },
        "note": {

        },
        "merge_request": {

        }
    }
}
```
This configuration will start GW Server at port `9000` showing the message same as given in `serverTitle` and when `push` webhook is triggered, it will match value `user_name` with `Kushal Pandya` and `project_id` with `15` within `requestBody` and if it evaluates to true, it will run `push_event_script.sh` and log everything on terminal that bash script generates.

In case of `tag_push` event, it will directly run `tag_event_push.sh` without any condition checks.

### Known Issues
---
In v0.1.0, `matches` map only supports evaluation of first level properties of `requestBody` object, so if you try to evaluate anything that's deep within the object, it will not evaluate it and `commandBatch` will not be executed, I'm planning to fix that in next release.

###Version Information
---
* [0.1.0](https://github.com/kushalpandya/gitlabce-webhook-server/releases/tag/v0.1.0) - First Release.

###Author
---
[Kushal Pandya](https://doublslash.com)
