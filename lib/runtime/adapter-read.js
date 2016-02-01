'use strict';
var EventEmitter = require('eventemitter3');
var JuttleLogger = require('../logger');
var juttle_utils = require('./juttle-utils');

//
// Base class for all adapter `read` implementations.
//
class AdapterRead {
    // Construct the adapter read module.
    //
    // The options and params from the original proc are stashed as fields so
    // the adapter can do its own validation after the fact.
    //
    // Adapters differ in terms of how they handle their time options.
    //
    // On the one hand, there are backend databases where time is an important
    // dimension, e.g. elastic search, influxdb, graphite, etc. For these, both
    // `-from` and `-to` default to :now:, and the user needs to specify at
    // least one of the two parameters.
    //
    // In other cases, like simple one-shot reads like file or http, the time
    // range is not required and is effectively ignored.
    //
    // Some sources like SQL operate in either of the two modes, depending on
    // the options that are passed.
    //
    // To accomodate this variation, the time options (from, to, last) are
    // normalized (i.e. last is converted into from and to) before passing them
    // in as options to the adapter, but the adapter is responsible for
    // calculating default values.
    constructor(options, params) {
        this.options = options;
        this.params = params;
        this.logger = JuttleLogger.getLogger(params.logger_name);
        this.events = new EventEmitter();
    }

    // Indicate how the adapter handles reading live points.
    //
    // If periodicLiveRead() is true, then when switching to live mode, the read
    // base class will compute time intervals and make multiple calls to
    // `read()` to read the data from the backend in chunks.
    //
    // By default this behavior is disabled.
    periodicLiveRead() {
        return false;
    }

    // Return the default time bound values for from and to.
    //
    // The default behavior is that for periodicLiveRead sources, from and to
    // default to now, otherwise there is no default value (i.e. they default to
    // undefined).
    defaultTimeRange() {
        if (this.periodicLiveRead()) {
            return {
                from: this.params.now,
                to: this.params.now
            };
        } else {
            return {
                from: undefined,
                to: undefined
            };
        }
    }

    // Common read options that should be supported by all adapters.
    static get commonOptions() { return ['from', 'to', 'last', 'timeField', 'every', 'lag']; }

    // Assigns the time from timeField to 'time' and attempts to convert it
    // into JuttleMoment.
    parseTime(points, timeField) {
        return juttle_utils.parseTime(points, timeField, this);
    }

    // Trigger the given event
    trigger(type, event) {
        this.events.emit(type, event);
    }

    // Subscribe to the given event types
    on(type, handler, context) {
        this.events.on(type, handler, context);
    }

    // Hook to indicate that the read has been started
    start() {
    }

    // Core API to read up to `limit` points within the given time interval (if
    // specified).
    //
    // If the adapter supports periodicLiveRead(), then from and to will always
    // be valid moments and the read proc will handle periodically moving
    // through time. Otherwise, from and to are only set if the user specified
    // them in the options and the adapter is responsible for handling the case
    // where they are undefined.
    //
    // Returns a promise that resolves with an object containing:
    //   points: the points that are ready to emit in the flowgraph
    //   readEnd: indication that the adapter has read all points up to but not
    //            including the given time. If readEnd == to, then this chunk
    //            is complete. If readEnd == :end: then eof is triggered.
    //   state: optional continuation state for paging
    //
    // The state returned from one call to read will be passed into a subsequent
    // call when fetching the points.
    read(from, to, limit, state) {
        throw new Error('read must be implemented');
    }
}

module.exports = AdapterRead;