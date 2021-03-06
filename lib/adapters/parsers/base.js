'use strict';

var EventEmitter = require('eventemitter3');

class ParserBase extends EventEmitter {
    /*
     * A parser must implement the parseStream function below and should fire
     * errors by using the
     * `this.emit('error', ...)` EvenEmitter method.
     */
    constructor(options) {
        super(options);
        this.limit = (options && options.limit) ? options.limit : 1024;
        this.stopAt = Number.POSITIVE_INFINITY;

        if (options.optimization && options.optimization.type === 'head') {
            this.stopAt = options.optimization.limit;
        }

        // its responsibility of each subclass to maintain these numbers 
        // where the totalRead counts the total number of data points read
        // from a stream while the totalParsed counts the ones that were 
        // actually parsed out to be sent
        this.totalRead = 0;
        this.totalParsed = 0;
    }

    parseStream(stream, emit) {
        throw new Error('parseStream must be implemented');
    }
}

module.exports = ParserBase;
