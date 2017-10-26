//
// renamed this config.json file to config.js to be able to introduce comments.
// required the same in nodejs.  require('config');
// only change is adding "module.exports = " to beginning of file.
//
module.exports = {
	"serverTitle": "ezproxy webhook listener",
	"hostname": "localhost", // remove for os.hostname()
	"listenerPort": 9000,
	"hooks": {
		"push": {
			"secretKey": "uerWkvxxb5PRBGSPdeA5mjjhEnjzh68X-ezproxy",
			"matches": {
				"project.default_branch": "production",
				"project.path_with_namespace": "ahlstn1/ezproxy"
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
