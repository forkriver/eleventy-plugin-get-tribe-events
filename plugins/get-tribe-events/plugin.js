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

	/**
	 * Default values for the plugin.
	 *
	 * Can be overridden in the `options` object passed by Eleventy.
	 *
	 * @since 1.0.0
	 *
	 * @type {Object} The default values.
	 */
	const defaults = {
		eventPath:         '/wp-json/tribe/events/v1/events',
		mode:              'production',
		exportPermalink:   '/events.json',
		overrideCalendar:  false,
		calendarPermalink: '/calendar/',
		calendarTitle:     'Calendar',
		itemsPerRequest:   50,
	}

	// Merges the default values and the `options` override values.
	const config = { ...defaults, ...options };

	const EVENT_API_URL = `${config.baseURL}${config.eventPath}`;

	/**
	 * Gets a page of events from the REST API.
	 *
	 * @since 1.0.0
	 *
	 * @param  {int} page The page to get; defaults to 1.
	 * @return {object}   Total, Full count, and Events.
	 */ 
	async function getEvents( nextURL = '' ) {
		try {
			let url;
			if ( 0 === nextURL.length ) {
				url = EVENT_API_URL;
				const params = {
					per_page: config.itemsPerRequest,
				};
				let requestString = '';
				for ( var key in params ) {
					requestString += key + '=' + params[ key ] + '&';
				}

				if ( requestString.length > 0 ) {
					url += '?' + requestString;
				}
			} else {
				url = nextURL;
			}

			let json = await Fetch( url, {
				duration: "6h",
				type:     "json",
			});

			return json;

		} catch( e ) {
			console.error( e );
		}
	}

	// Builds the 'events' collection.
	eleventyConfig.addCollection( 'events', async (collectionsApi) => {
		let allEvents = [];
		let events = await getEvents();
		let i = 1;
		allEvents.push( ...events.events );
		while ( events.next_rest_url ) {
			events = await getEvents( events.next_rest_url );
			allEvents.push( ...events.events );
		}
		return allEvents;
	} );

	eleventyConfig.addTemplate( 'events-template.njk', eventsTemplate(), {
		permalink: config.exportPermalink
	} );
	if ( ! config.overrideCalendar ) {
		eleventyConfig.addTemplate( 'calendar-template.html', calendarTemplate(), {
			permalink: config.calendarPermalink
		} );
	}

	/**
	 * Generates the virtual NJK template.
	 *
	 * @since 1.0.0
	 *
	 * @return {string} The template NJK code.
	 */
	function eventsTemplate() {
		return `[
{%- for item in collections.events %}
	{
		"id": "{{ item.id }}",
		"title": "{{ item.title }}",
		"url": "{{ item.url }}",
		"start": "{{ item.start_date }}",
		"end": "{{ item.end_date }}"
	}{% if not loop.last %},{% endif %}
{% endfor -%}
]`;
	}

	/**
	 * Generates the default calendar template.
	 *
	 * @since 1.0.0
	 *
	 * @return {string} The calendar page HTML.
	 */
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
		  // height: 'calc( 100vh - 4em )',
		  height: 'auto',
		  stickyHeaderDates: true,
		  headerToolbar: {
			start: 'title',
			center: '',
			end: 'today listMonth,dayGridMonth,multiMonthYear prev,next'
		  },
		  multiMonthMaxColumns: 3,
          events: '/events.json'
        });
        calendar.render();
      });
    </script>
</head>

<body>
	 <div id="calendar"></div>

</body>

</html>`;
	}

}