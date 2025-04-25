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
require('dotenv').config();

module.exports = function( eleventyConfig, options = {} ) {

	const defaults = {
		baseURL:   getEventServer( options ),
		eventPath: getEventPath( options ),
		eventMode: getEventMode( options ),
	}

	const config = { ...defaults, ...options };

	const ITEMS_PER_REQUEST = 50;

	/**
	 * Gets a page of events from the REST API.
	 *
	 * @since 1.0.0
	 *
	 * @param  {int} page The page to get; defaults to 1.
	 * @return {object}   Total, Full count, and Events.
	 */ 
	async function getEvents( url = '' ) {
		try {
			if ( ! url || 0 === url.length ) {
				url = config.baseURL + config.eventPath;

				let queryArray = [
					`page=1`,
					`per_page=${ITEMS_PER_REQUEST}`,
				];

				let querystring = queryArray.join( '&' );
				if ( querystring ) {
					url += '?' + querystring;
				}
				console.log( 'Set URL to ' + url );
			} else {
				console.log( 'Using supplied URL ' + url );
			}

			let json = await Fetch( url, {
				duration: "4h",
				type:     "json",
			});

			return json;

		} catch( e ) {
			console.error( e );
			return {};
		}
	}

	async function getAllEvents() {
		let events = [];
		let data = await getEvents();
		// ...this doesn't seem to expand the array, so... might need to read up on the ... operator.
		events = events.concat( data.events );
		while ( data.next_rest_url ) {
			data = await getEvents( data.next_rest_url );
			events = events.concat( data.events );
		}
		events = deDupeEvents( events );

		console.log( events[0] );

		return events;
	}

	return getAllEvents();
}

/** Debuggin'. */

/**
 * Debug: Show what's all set in an Event.
 *
 * @param  {Object} item The item to inspect.
 */
function whatsInThere( events ) {
	events.forEach( function( event ) {
		console.log( event.start_date + ' (GMT: ' + event.utc_start_date + ')' );
	});
}

/* Helper monkeys. */

/**
 * Gets the Events Server URL.
 *
 * @since 1.0.0
 *
 * @param  {Object} options Plugin options object.
 * @return {string}         Events server URL.
 */
function getEventServer( options = {} ) {
	if ( options.baseURL ) {
		return options.baseURL;
	}
	if ( process.env.EVENT_SERVER ) {
		return process.env.EVENT_SERVER;
	}
	return '';
}

/**
 * Gets the path to pull from the Events server.
 *
 * @since 1.0.0
 *
 * @param  {Object} options Plugin options object.
 * @return {string}         The REST API path.
 */
function getEventPath( options = {} ) {
	if ( options.eventPath ) {
		return options.eventPath;
	}
	if ( process.env.EVENT_PATH ) {
		return process.env.EVENT_PATH;
	}
	return '';
}

/**
 * Gets the mode we're running in.
 *
 * @since 1.0.0
 *
 * @param  {Object} options Plugin options object.
 * @return {string}         The mode; default 'production'; other valid values: 'dev', 'local'.
 */
function getEventMode( options = {} ) {
	if ( options.eventMode ) {
		return options.eventMode;
	}
	if ( process.env.EVENT_MODE ) {
		return process.env.EVENT_MODE;
	}
	return 'production';
}

/**
 * Deduplicates the array of Events.
 *
 * Uses the `id` property -- ie, the WordPress post ID -- to detect identical Events.
 *
 * @since 1.0.0
 *
 * @param  {Array} events The array of events.
 * @return {Array}        The filtered array. 
 */
function deDupeEvents( events = [] ) {
	let e = events.concat();
	for( var i = 0; i < e.length; ++i ) {
		for ( var j = i + 1; j < e.length; ++j ) {
			if ( e[i].id === e[j].id ) {
				e.splice( j--, 1 );
			}
		}
	}	
	return e;
}