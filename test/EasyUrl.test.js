(function(global) {
    function factory(EasyUrl, chai, sinon) {

        return describe('EasyUrl', function() {
            it('Should parse a simple URL', function() {
                var url = new EasyUrl('http://user:pass@domain.tld:1337/path?search#hash');

                chai.assert.equal(url.protocol, 'http:');
                chai.assert.equal(url.auth, 'user:pass');
                chai.assert.equal(url.hostname, 'domain.tld');
                chai.assert.equal(url.port, 1337);
                chai.assert.equal(url.pathname, '/path');
                chai.assert.equal(url.search, '?search');
                chai.assert.equal(url.hash, '#hash');

                chai.assert.equal(url.host, 'domain.tld:1337');
                chai.assert.equal(url.user, 'user');
                chai.assert.equal(url.pass, 'pass');
                chai.assert.equal(url.path, '/path?search');
            });
        });
    }

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['EasyUrl', 'chai', 'sinon', 'mocha'], factory);
    } else {
        // Browser globals
        factory(global.EasyUrl, global.chai, global.sinon, global.mocha);
    }
}(this));