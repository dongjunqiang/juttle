'use strict';

var _ = require('underscore');
var utils = require('../juttle-utils');
var fanin = require('./fanin');
var Groups = require('../groups');

var INFO = {
    type: 'proc',
    options: {}   // documented, non-deprecated options only
};

class head extends fanin {
    constructor(options, params, location, program) {
        super(options, params, location, program);
        if (options.arg && !utils.isInteger(options.arg)) {
            throw this.compile_error('INTEGER-REQUIRED', {
                proc: 'head',
                argument: 'limit'
            });
        }
        this.limit = options.arg;
        this.groups = new Groups(this, options);
    }
    procName() {
        return 'head';
    }
    process(points) {
        var k, row;
        for (k = 0; k < points.length; ++k) {
            row = this.groups.lookup(points[k]);
            if (!_.has(row, 'sent')) {
                row.sent = 0;
            }
            if (row.sent < this.limit) {
                row.sent++;
                this.emit([points[k]]);
            }
        }
    }
    mark(mark, from) {
        // process and publish each mark
        this.groups.reset();
        this.emit_mark(mark);
    }
    eof(from) {
        this.groups.reset();
        this.emit_eof();
    }

    static get info() {
        return INFO;
    }
}

module.exports = head;
