/**
 * Plugin loader file.
 *
 * @since 1.0.0
 *
 * @package get-tribe-events
 *
 * @link https://github.com/declanbyrd/eleventy-plugin-mastoarchive/
 */

const Fetch = require( '@11ty/eleventy-fetch' );

module.exports = function( eleventyConfig, options ) {

	if ( ! options.baseURL ) {
		console.error( "\n" + '!!! Error: "baseURL" option is required.' + "\n" );
	}

	const defaults = {
		eventPath: '/wp-json/tribe/events/v1/events/this/is/clearly/wrong',
		mode:      'production',
	}

	const config = { ...defaults, ...options };

	const EVENT_API         = `${config.baseURL}${config.eventPath}`;
	const ITEMS_PER_REQUEST = 50;

	/**
	 * Gets a page of events from the REST API.
	 *
	 * @since 1.0.0
	 *
	 * @param  {int} page The page to get; defaults to 1.
	 * @return {object}   Total, Full count, and Events.
	 */ 
	async function getEvents( page = 1 ) {
		try {
			let url = EVENT_API;
			if ( 1 < page ) {
				url += `?page=${page}`;
			}
			const params = {
				params: {
					page:     page,
					per_page: ITEMS_PER_REQUEST,
					order:    "desc",
				},
			};

			let json = await Fetch( url, {
				duration: "1w",
				type:     "json",
			});

			console.log( json );

			return json;

		} catch( e ) {
			console.error( e );
		}
	}

	return getEvents();
}