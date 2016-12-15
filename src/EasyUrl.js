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

const properties = {
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

function EasyUrl () {
  return this._init.apply(this, arguments);
}

EasyUrl.prototype = {
  _init (href, relativeTo) {
    if (relativeTo) {
      if (!(relativeTo instanceof EasyUrl)) {
        relativeTo = new EasyUrl(relativeTo);
      }

      this.base = relativeTo;
    }

    if (!href) {
      return;
    }

    if (typeof href === 'string') {
      this.href = href;
      return;
    }

    Object.keys(href).forEach((key) => {
      if (key in properties) {
        this[key] = href[key];
      }
    });
  },

  get auth () {
    return EasyUrl.formatAuth({ user: this.user, pass: this.pass });
  },

  set auth (auth) {
    delete this.user;
    delete this.pass;

    if (typeof auth === 'string') {
      auth = EasyUrl.parseAuth(auth);
    }

    if (auth.user) {
      this.user = auth.user;
      if (auth.pass) {
        this.pass = auth.pass;
      }
    }
  },

  get host () {
    return EasyUrl.buildHost(this.hostname, this.port);
  },

  get path () {
    return EasyUrl.buildPath(this.pathname, this.query);
  },

  get search () {
    return EasyUrl.formatQuery(this.query);
  },

  set search (search) {
    this.query = EasyUrl.parseQuery(search);
  },

  get href () {
    return this.toString();
  },

  set href (href) {
    var parsedUrl = EasyUrl.parse(href, this.base);

    Object.keys(parsedUrl).forEach(function (key) {
      this[key] = parsedUrl[key];
    }.bind(this));
  },

  toObject (simple) {
    var object = {};

    Object.keys(properties).forEach((key) => {
      if (!simple || properties[key]) {
        object[key] = this[key];
      }
    });

    return object;
  },

  toString () {
    return EasyUrl.format(this);
  }
};

EasyUrl.pattern_url = new RegExp([
  // protocol
  /^(?:([a-z]{1,6}:)?(\/\/)?)?/,
  // auth (user:pass)
  /(?:([^/@]*?)@)?/,
  // host (hostname:port)
  /(.*?)(?::([0-9]+))?/,
  // pathname
  /(\/[^?]*?)?/,
  // search
  /(\?[^#]*?)?/,
  // hash
  /(#.*)?$/
].map((r) => r.source).join(''), 'i');

function resolveRelative (from, to) {
  var resolved = {
    pathname: to.pathname,
    query: to.query,
    hash: to.hash
  };

  if (from.pathname) {
    let basePath = from.pathname.split('/');
    basePath.length--;
    resolved.pathname = basePath.join('/') + to.pathname;
  }

  resolved.protocol = from.protocol;
  resolved.slashedProtocol = from.slashedProtocol;
  resolved.user = from.user;
  resolved.pass = from.pass;
  resolved.hostname = from.hostname;
  resolved.port = from.port;

  return resolved;
}

EasyUrl.parse = function parse (url, relativeTo) {
  var urlMatch = EasyUrl.pattern_url.exec(url);
  var auth;

  var parsedUrl = {};

  if (!urlMatch) {
    throw new Error('EasyUrl Parse Error on URL: ' + url);
  }

  parsedUrl.protocol = urlMatch[1] || undefined;
  parsedUrl.slashedProtocol = parsedUrl.protocol && !!urlMatch[2];
  parsedUrl.hostname = urlMatch[4];
  parsedUrl.port = +urlMatch[5] || undefined;
  parsedUrl.pathname = urlMatch[6];
  parsedUrl.query = EasyUrl.parseQuery(urlMatch[7]);
  parsedUrl.hash = urlMatch[8] || undefined;

  if (urlMatch[3]) {
    auth = EasyUrl.parseAuth(urlMatch[3]);
    parsedUrl.user = auth.user;
    parsedUrl.pass = auth.pass;
  }

  // In all those cases, given URL can't be relative. Parsing is finished
  if (!relativeTo || parsedUrl.protocol || auth || parsedUrl.port) {
    return parsedUrl;
  }

  // Given URL is relative to some other URL.
  // so there's no hostname, it is the begining of the pathname
  // Let start by fixing this
  parsedUrl.pathname = parsedUrl.hostname + (parsedUrl.pathname || '');
  if (parsedUrl.pathname[0] !== '/') {
    parsedUrl.pathname = '/' + parsedUrl.pathname;
  }

  if (typeof relativeTo === 'string') {
    relativeTo = EasyUrl.parse(relativeTo);
  }

  return resolveRelative(relativeTo, parsedUrl);
};

EasyUrl.format = function format (urlObject) {
  var urlString = '';

  if (urlObject.hostname || urlObject.host) {
    if (urlObject.protocol) {
      urlString += urlObject.protocol;
      if (urlObject.slashedProtocol !== false) {
        urlString += '//';
      }
    }

    if (urlObject.user || urlObject.auth) {
      urlString += (
        urlObject.auth ||
        EasyUrl.formatAuth({user: urlObject.user, pass: urlObject.pass})
      ) + '@';
    }

    urlString += urlObject.host ||
      EasyUrl.buildHost(urlObject.hostname, urlObject.port);
  }

  urlString += urlObject.path ||
    EasyUrl.buildPath(urlObject.pathname, urlObject.query || urlObject.search);

  urlString += urlObject.hash || '';

  return urlString;
};

EasyUrl.parseAuth = function parseAuth (auth) {
  var parsed = {};

  if (auth) {
    let authColonIdx = auth.indexOf(':');
    if (authColonIdx !== -1) {
      parsed.user = decodeURIComponent(auth.slice(0, authColonIdx));
      parsed.pass = decodeURIComponent(auth.slice(authColonIdx + 1));
    } else {
      parsed.user = decodeURIComponent(auth);
    }
  }

  return parsed;
};

EasyUrl.formatAuth = function formatAuth (auth) {
  if (!auth.user) {
    return;
  }
  var result = encodeURIComponent(auth.user);
  if (auth.pass) {
    result += ':' + encodeURIComponent(auth.pass);
  }
  return result;
};

EasyUrl.buildHost = function buildHost (hostname, port) {
  var host = hostname;

  if (port) {
    host += ':' + port;
  }

  return host;
};

EasyUrl.buildPath = function buildPath (pathname, search) {
  var path = pathname || '';

  if (typeof search === 'string') {
    path += search;
  } else if (typeof search === 'object') {
    path += EasyUrl.formatQuery(search);
  }

  return path;
};

EasyUrl.parseQuery = function parseQuery (search) {
  var query = {};

  if (!search) {
    return query;
  }

  if (search[0] === '?') {
    search = search.substr(1);
  }

  search.split('&').forEach((param) => {
    if (!param) {
      return;
    }

    let equalIdx = param.indexOf('=');

    if (equalIdx === -1) {
      query[decodeURIComponent(param)] = null;
      return;
    }

    let key = decodeURIComponent(param.substr(0, equalIdx));
    let value = decodeURIComponent(param.substr(equalIdx + 1));

    query[key] = value;
  });

  return query;
};

EasyUrl.formatQuery = function formatQuery (query) {
  var search = Object.keys(query).map(function (key) {
    var param = encodeURIComponent(key);
    if (query[key] !== null) {
      param += '=' + encodeURIComponent(query[key]);
    }
    return param;
  }).join('&');

  if (search) {
    return '?' + search;
  }

  return '';
};

module.exports = EasyUrl;
