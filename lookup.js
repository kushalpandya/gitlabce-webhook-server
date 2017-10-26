/*
 * lookup function for inspection objects for keys down several levels.
 * from:
 * https://gist.github.com/megawac/6162481#file-underscore-lookup-js
 */

var _ = require('underscore');

_.mixin({
	lookup: function (obj, key) {
		var type = typeof key, i = 0, length;
		if (type == "string" || type == "number") {
			key = ("" + key).replace(/\[(.*?)\]/g, function (m, key) { //handle case where [1] or ['xa'] may occur
				return "." + key.replace(/^["']|["']$/g, ""); //strip quotes at the start or end of the key
			}).split(".");
		}
		for (length = key.length; i < length; i++) {
			if (_.has(obj, key[i])) obj = obj[key[i]];
			else return void 0;
		}
		return obj;
	}
});

module.exports = _;
