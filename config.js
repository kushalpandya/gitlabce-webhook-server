//
// renamed this config.json file to config.js to be able to introduce comments.
// required the same in nodejs.  require('config');
// only change is adding "module.exports = " to beginning of file.
//
module.exports = {
	"serverTitle": "gitlab webhook listener",
	"hostname": "localhost", // remove for os.hostname()
	"listenerPort": 9000,
	"hooks": {
		"push": {
			"secretKey": "SECRETKEYHERE",
			"matches": {
				"project.default_branch": "production",
				"project.path_with_namespace": "username/reponame"
			},
			"commandBatch": "./shellscript.sh"
		},

/*
 * unused 
 *
		"tag_push": {

		},
		"issue": {

		},
		"note": {

		},
		"merge_request": {

		}
*
*/

	}
}
