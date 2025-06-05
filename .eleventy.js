const eventPlugin = require( './plugins/get-tribe-events/plugin.js' );

module.exports = async function ( eleventyConfig ) {

	eleventyConfig.addPlugin( eventPlugin, {
		'baseURL':   'http://events.local',
	} );

	return {
		dir: {
			input: 'src',
			output: 'public',
		}
	};
};