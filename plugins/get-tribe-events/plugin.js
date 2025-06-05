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
		eventPath:         '/wp-json/tribe/events/v1/events',
		mode:              'production',
		exportPermalink:   '/events.json',
		overrideCalendar:  false,
		calendarPermalink: '/calendar/',
		calendarTitle:     'Calendar',
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
[
{% for item in collections.events %}
	{
		"id": "{{ item.id }}",
		"title": "{{ item.title }}",
		"url": "{{ item.url }}",
		"start": "{{ item.start_date }}",
		"end": "{{ item.end_date }}"
	}{% if not loop.last %},{% endif %}
{% endfor %}
]`;
	}

	function calendarTemplate() {
		return `<!DOCTYPE html>
<html>
<head>
	<title>${config.calendarTitle}</title>
	<meta charset='utf-8' />
    <script src='https://cdn.jsdelivr.net/npm/fullcalendar@6.1.17/index.global.min.js'></script>
    <script>
    	document.addEventListener('DOMContentLoaded', function() {
        var calendarEl = document.getElementById('calendar');
        var calendar = new FullCalendar.Calendar(calendarEl, {
          initialView: 'dayGridMonth',
          events: '/events.json'
        });
        calendar.render();
      });
    </script>
</head>

<body>
	 <h1>Events</h1>
	 <div id="calendar"></div>

</body>

</html>`;
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
	if ( ! config.overrideCalendar ) {
		eleventyConfig.addTemplate( 'calendar-template.html', calendarTemplate(), {
			permalink: config.calendarPermalink
		} );
	}

}