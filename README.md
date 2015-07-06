Simple URL parsing/formating tool
=========

This module defines simple tools for parsing or formating URLs.


Installation
--------------
This library has been declined in a bower component so in order to use it just add it to your project's bower.json dependencies :

```json
"dependencies": {
    ...
    "EasyUrl": "https://github.com/francetv/easyurl.git"
    ...
}
```

How to use it
--------------

This library implements [UMD](http://bob.yexley.net/umd-javascript-that-runs-anywhere/), so you can import it with AMD or browser globals

```javascript
require.config({
    ...
    paths: {
        'EasyUrl': './bower_components/EasyUrl/EasyUrl.min.js'
    }
})
require(['EasyUrl', ...], function (EasyUrl, ...) {
    ...
});
```

or

```html
<script type="text/javascript" src="./bower_components/EasyUrl/EasyUrl.min.js" />
```

