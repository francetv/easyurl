(function(global) {
    "use strict";

    function factory() {
        /**

        Composant d'origine :
            - href

        Composants brut :

            - protocol (avec : et en minuscule)
            - slashedProtocol (:// ou :)
            - auth (sans @ final)
            - hostname
            - port (sans :)
            - pathname (avec / initial)
            - search (avec ?)
            - hash (avec #)

        Composants complémentaires :
            - user
            - pass
            - host (hostname + port)
            - path (pathname + search)
            - query (search parsé en objet JS)

        */

        var properties = {
            protocol: true,
            slashedProtocol: true,
            auth: true,
            hostname: true,
            port: true,
            pathname: true,
            search: true,
            hash: true,

            user: false,
            pass: false,
            host: false,
            path: false,
            query: false
        };


        function EasyUrl() {
            return this.init.apply(this, arguments);
        }

        EasyUrl.prototype = {
            pattern_href: /^(?:([a-z]{1,6}\:)(\/\/)?)?(?:([^\/@]*?)@)?(.*?)(?::([^0-9]+))?(\/[^\?]*?)?(\?[^#]*?)?(#.*)?$/i,

            init: function init(href, relativeTo) {
                var key;

                if (relativeTo) {
                    if (!(relativeTo instanceof EasyUrl)) {
                        relativeTo = new EasyUrl(relativeTo);
                    }

                    this.base = relativeTo;
                }

                if (href) {
                    if (typeof href === 'string') {
                        this.href = href;
                        this.parse();
                    } else {
                        for (key in href) {
                            if (key in properties) {
                                this[key] = href[key];
                            }
                        }
                        this.format();
                    }
                }
            },

            parse: function parse() {
                var parsedUrl = EasyUrl.parse(this.href, this.base);
                var auth;

                Object.keys(parsedUrl).forEach(function(key) {
                    this[key] = parsedUrl[key];
                }.bind(this));

                if (this.hostname) {
                    this.host = EasyUrl.buildHost(this.hostname, this.port);
                }

                if (this.pathname || this.search) {
                    this.path = EasyUrl.buildPath(this.pathname, this.search);
                }

                if (this.auth) {
                    auth = EasyUrl.parseAuth(this.auth);
                    this.user = auth.user;
                    this.pass = auth.pass;
                }

                this.query = EasyUrl.parseQuery(this.search);
            },

            format: function format() {
                this.href = this.toString();
            },

            toObject: function toObject(simple) {
                var object = {};
                var key;

                for (key in properties) {
                    if (!simple || properties[key]) {
                        object[key] = this[key];
                    }
                }

                return object;
            },

            toString: function toString() {
                var urlString = '';

                if (this.hostname || this.host) {
                    if (this.protocol) {
                        urlString += this.protocol;
                        if (this.slashedProtocol) {
                            urlString += '//';
                        }
                    }

                    if (this.auth || this.user) {
                        urlString += (this.auth || EasyUrl.formatAuth(this.user, this.pass)) + '@';
                    }

                    urlString += this.host || EasyUrl.buildHost(this.hostname, this.port);
                }

                urlString += this.path || EasyUrl.buildPath(this.pathname, this.query || this.search);

                urlString += this.hash || '';

                return urlString;
            }
        };

        EasyUrl.pattern_url = /^(?:([a-z]{1,6}\:)(\/\/)?)?(?:([^\/@]*?)@)?(.*?)(?::([0-9]+))?(\/[^\?]*?)?(\?[^#]*?)?(#.*)?$/i;

        EasyUrl.parse = function parse(url, relativeTo) {
            var urlMatch = EasyUrl.pattern_url.exec(url);
            var basePath;

            var parsedUrl = {};

            if (!urlMatch) {
                throw new Error('EasyUrl Parse Error on URL: ' + url);
            }

            parsedUrl.protocol = urlMatch[1];
            parsedUrl.slashedProtocol = parsedUrl.protocol && !!urlMatch[2];
            parsedUrl.auth = urlMatch[3];
            parsedUrl.hostname = urlMatch[4];
            parsedUrl.port = +urlMatch[5] || undefined;
            parsedUrl.pathname = urlMatch[6];
            parsedUrl.search = urlMatch[7];
            parsedUrl.hash = urlMatch[8];

            if (parsedUrl.protocol || parsedUrl.auth || parsedUrl.port || !relativeTo) {
                return parsedUrl;
            }

            if (typeof relativeTo === 'string') {
                relativeTo = EasyUrl.parse(relativeTo);
            }

            parsedUrl.pathname = parsedUrl.hostname + (parsedUrl.pathname || '');
            if (parsedUrl.pathname[0] !== '/') {
                parsedUrl.pathname = '/' + parsedUrl.pathname;
            }

            if (relativeTo.pathname) {
                basePath = relativeTo.pathname.split('/');
                basePath.length--;
                parsedUrl.pathname = basePath.join('/') + parsedUrl.pathname;
            }

            parsedUrl.protocol = relativeTo.protocol;
            parsedUrl.auth = relativeTo.auth;
            parsedUrl.hostname = relativeTo.hostname;
            parsedUrl.port = relativeTo.port;

            return parsedUrl;
        };

        EasyUrl.parseAuth = function parseAuth(auth) {
            var parsed = {};
            var authColonIdx;

            authColonIdx = auth.indexOf(':');
            if (authColonIdx !== -1) {
                parsed.user = auth.slice(0, authColonIdx);
                parsed.pass = auth.slice(authColonIdx + 1);
            } else {
                parsed.user = auth;
            }

            return parsed;
        };

        EasyUrl.formatAuth = function formatAuth(auth) {
            var result = auth.user;
            if (auth.pass) {
                result += ':' + auth.pass;
            }
            return result;
        };

        EasyUrl.buildHost = function buildHost(hostname, port) {
            var host = hostname;

            if (port) {
                host+= ':' + port;
            }

            return host;
        };

        EasyUrl.buildPath = function buildPath(pathname, search) {
            var path = pathname || '';

            if (typeof search === 'string') {
                path += search;
            }
            else if (typeof search === 'object') {
                path += EasyUrl.formatQuery(search);
            }

            return path;
        };

        EasyUrl.parseQuery = function parseQuery(search) {
            var query = {};

            if (!search) {
                return query;
            }

            if (search[0] === '?') {
                search = search.substr(1);
            }

            search.split('&').forEach(function(param) {
                var equalIdx;

                if (!param) {
                    return;
                }

                equalIdx = param.indexOf('=');

                if (equalIdx === -1) {
                    query[param] = null;
                    return;
                }

                query[param.substr(0, equalIdx)] = param.substr(equalIdx + 1);
            });

            return query;
        };

        EasyUrl.formatQuery = function formatQuery(query) {
            var search = Object.keys(query).map(function(key) {
                var param = key;
                if (query[key] !== null) {
                    param += '=' + query[key];
                }
                return param;
            }).join('&');

            if (search) {
                return '?' + search;
            }

            return '';
        };

        return EasyUrl;
    }

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define('EasyUrl', [], factory);
    } else {
        // Browser globals
        global.EasyUrl = factory();
    }
}(this));