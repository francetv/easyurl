/* global define describe it */

(function (global) {
  function factory (EasyUrl, chai, sinon) {
    function cloneAndProtectForNullValues (object) {
      return JSON.parse(JSON.stringify(object).replace(/:null(\,|\}|\])/g, ':"protected null value"$1'));
    }

    return describe('EasyUrl', function () {
      it('Should parse a simple URL', function () {
        var url = new EasyUrl('http://user:pass@domain.tld:1337/path?search&param=value#hash');

        chai.assert.equal(url.protocol, 'http:');
        chai.assert.equal(url.auth, 'user:pass');
        chai.assert.equal(url.hostname, 'domain.tld');
        chai.assert.equal(url.port, 1337);
        chai.assert.equal(url.pathname, '/path');
        chai.assert.equal(url.search, '?search&param=value');
        chai.assert.equal(url.hash, '#hash');

        chai.assert.equal(url.host, 'domain.tld:1337');
        chai.assert.equal(url.user, 'user');
        chai.assert.equal(url.pass, 'pass');
        chai.assert.equal(url.path, '/path?search&param=value');
        chai.assert.deepEqual(url.query, {
          search: null,
          param: 'value'
        });
      });

      it('Should format a simple URL', function () {
        var url = new EasyUrl('http://user:pass@domain.tld:1337/path?search&param=value#hash');

        delete url.path;
        delete url.host;

        url.hostname = 'changed.domain.tld';
        url.port = 42;
        url.pathname = '/new/path';

        url.query = {
          newsearch: 'value',
          newparam: null
        };

        chai.assert.equal(url.toString(), 'http://user:pass@changed.domain.tld:42/new/path?newsearch=value&newparam#hash');
        chai.assert.equal(url.format(), 'http://user:pass@changed.domain.tld:42/new/path?newsearch=value&newparam#hash');
      });

      it('Should format a URL relative to another', function () {
        var url = new EasyUrl('relative/path', 'http://domain.tld/path/');

        chai.assert.equal(url.toString(), 'http://domain.tld/path/relative/path');
      });

      it('Should format a URL from an object', function () {
        var url = new EasyUrl({
          protocol: 'http:',
          hostname: 'domain.tld',
          pathname: '/path',
          query: {
            query1: 'value1',
            query2: 'value2'
          }
        });

        chai.assert.equal(url.toString(), 'http://domain.tld/path?query1=value1&query2=value2');
      });

      it('Should return an URL object with toObject method', function () {
        var url = new EasyUrl('http://user:pass@domain.tld:1337/path?search&param=value#hash');

        var result = cloneAndProtectForNullValues(url.toObject());

        chai.assert.deepEqual(result, {
          protocol: 'http:',
          slashedProtocol: true,
          auth: 'user:pass',
          hostname: 'domain.tld',
          port: 1337,
          pathname: '/path',
          search: '?search&param=value',
          hash: '#hash',
          user: 'user',
          pass: 'pass',
          host: 'domain.tld:1337',
          path: '/path?search&param=value',
          query: {
            search: 'protected null value',
            param: 'value'
          }
        });
      });

      it('should decode URIencoded values', function () {
        var url = new EasyUrl('http://us%3Aer:pa%2Fss@domain.tld:1337/path?sea%26rch&par%2Fam=va%3Dlue#hash');

        var result = cloneAndProtectForNullValues(url.toObject());

        chai.assert.deepEqual(result, {
          protocol: 'http:',
          slashedProtocol: true,
          auth: 'us%3Aer:pa%2Fss',
          hostname: 'domain.tld',
          port: 1337,
          pathname: '/path',
          search: '?sea%26rch&par%2Fam=va%3Dlue',
          hash: '#hash',
          user: 'us:er',
          pass: 'pa/ss',
          host: 'domain.tld:1337',
          path: '/path?sea%26rch&par%2Fam=va%3Dlue',
          query: {
            'sea&rch': 'protected null value',
            'par/am': 'va=lue'
          }
        });
      });

      it('should encode URI components', function () {
        var url = new EasyUrl({
          protocol: 'http:',
          slashedProtocol: true,
          hostname: 'domain.tld',
          port: 1337,
          pathname: '/path',
          hash: '#hash',
          user: 'us:er',
          pass: 'pa/ss',
          query: {
            'sea&rch': null,
            'par/am': 'va=lue'
          }
        });

        chai.assert.deepEqual(url.toString(), 'http://us%3Aer:pa%2Fss@domain.tld:1337/path?sea%26rch&par%2Fam=va%3Dlue#hash');
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
