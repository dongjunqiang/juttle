var expect = require('chai').expect;
var fs = require('fs');
var serializers = require('../../../lib/adapters/serializers');
var parsers = require('../../../lib/adapters/parsers');
var tmp = require('tmp');

describe('serializers/jsonl', function() {

    it('can instantiate a jsonl serializer', function() {
        var tmpFilename = tmp.tmpNameSync();
        var stream = fs.createWriteStream(tmpFilename);
        var serializer = serializers.getSerializer('jsonl', stream);
        expect(serializer).to.not.be.undefined();
    });

    it('can write no points to a provided stream', function(done) {
        var tmpFilename = tmp.tmpNameSync();
        var stream = fs.createWriteStream(tmpFilename);
        var serializer = serializers.getSerializer('jsonl', stream);
        serializer.done();
        stream.end(function(err) {
            if (err) {
                done(err);
            }
            expect(fs.readFileSync(tmpFilename).toString()).to.equal('');
            done();
        });
    });

    it('can write out a few points correctly', function(done) {
        var tmpFilename = tmp.tmpNameSync();
        var stream = fs.createWriteStream(tmpFilename);
        var serializer = serializers.getSerializer('jsonl', stream);
        var data = [
            { time: '2014-01-01T00:00:00.000Z', foo: 'bar' },
            { time: '2014-02-01T00:00:00.000Z', fizz: 'buzz' },
            { time: '2014-03-01T00:00:00.000Z', fuzz: 'bizz' }
        ];
        serializer.write(data);
        serializer.done();
        stream.end(function(err) {
            if (err) {
                done(err);
            }

            var parser = parsers.getParser('jsonl');
            var results = [];
            return parser.parseStream(fs.createReadStream(tmpFilename), function(result) {
                results.push(result);
            })
            .then(function() {
                expect(results).to.deep.equal([data]);
                done();
            })
            .catch(function(err) {
                done(err);
            })
            .finally(function() {
                fs.unlinkSync(tmpFilename);
            });
        });
    });

});
