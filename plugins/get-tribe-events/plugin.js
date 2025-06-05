/**
 * Plugin loader file.
 *
 * @since 1.0.0
 *
 * @package get-tribe-events
 *
 * @link https://github.com/declanbyrd/eleventy-plugin-mastoarchive/
 * @link https://piccalil.li/blog/create-json-feed-eleventy/ - Save to a JSON file
 */

const Fetch = require( '@11ty/eleventy-fetch' );

module.exports = function( eleventyConfig, options ) {

	if ( ! options.baseURL ) {
		console.error( "\n" + '!!! Error: "baseURL" option is required.' + "\n" );
	}

	const defaults = {
		eventPath:       '/wp-json/tribe/events/v1/events/this/is/clearly/wrong',
		mode:            'production',
		exportPermalink: '/events.json',
	}

	const config = { ...defaults, ...options };

	const EVENT_API         = `${config.baseURL}${config.eventPath}`;
	const ITEMS_PER_REQUEST = 50;

	/**
	 * Generates the virtual NJK template.
	 *
	 * @since 1.0.0
	 *
	 * @return {string} The template NJK code.
	 */
	function eventsTemplate() {
		return `
{
	"events": [
	{% for item in collections.events %}
		{
			"id": "{{ item.id }}",
			"title": "{{ item.title }}",
			"url": "{{ item.url }}",
			"startStr": "{{ item.start_date }}.000",
			"endStr": "{{ item.end_date }}.000"
		}{% if not loop.last %},{% endif %}
	{% endfor %}
	]
}`;
	}

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
				duration: "6h",
				type:     "json",
			});

			// console.log( json );

			return json.events;

		} catch( e ) {
			console.error( e );
		}
	}
	eleventyConfig.addCollection( 'events', async (collectionsApi) => {
		return getEvents();
	} );
	eleventyConfig.addTemplate( 'events-template.njk', eventsTemplate(), {
		permalink: config.exportPermalink
	} );

}