# @flexis/workbox-webpack-plugin

[![NPM version][npm]][npm-url]
[![Node version][node]][node-url]
[![Peer dependencies status][peer-deps]][peer-deps-url]
[![Dependencies status][deps]][deps-url]
[![Build status][build]][build-url]
[![Greenkeeper badge][greenkeeper]][greenkeeper-url]

[npm]: https://img.shields.io/npm/v/@flexis/workbox-webpack-plugin.svg
[npm-url]: https://npmjs.com/package/@flexis/workbox-webpack-plugin

[node]: https://img.shields.io/node/v/@flexis/workbox-webpack-plugin.svg
[node-url]: https://nodejs.org

[peer-deps]: https://david-dm.org/TrigenSoftware/flexis-workbox-webpack-plugin/peer-status.svg
[peer-deps-url]: https://david-dm.org/TrigenSoftware/flexis-workbox-webpack-plugin?type=peer

[deps]: https://david-dm.org/TrigenSoftware/flexis-workbox-webpack-plugin.svg
[deps-url]: https://david-dm.org/TrigenSoftware/flexis-workbox-webpack-plugin

[build]: http://img.shields.io/travis/com/TrigenSoftware/flexis-workbox-webpack-plugin.svg
[build-url]: https://travis-ci.com/TrigenSoftware/flexis-workbox-webpack-plugin

[greenkeeper]: https://badges.greenkeeper.io/TrigenSoftware/flexis-workbox-webpack-plugin.svg
[greenkeeper-url]: https://greenkeeper.io/

Webpack plugin to generate and inject precache manifest to ServiceWorker. Created specially for [`service-worker-loader`](https://github.com/mohsen1/service-worker-loader).

## Install

```bash
npm i -D @flexis/workbox-webpack-plugin
# or
yarn add -D @flexis/workbox-webpack-plugin
```

## Usage

Import (or require) the ServiceWorker in one of the bundle's files:

```js
import registerServiceWorker from './serviceWorker';

registerServiceWorker({ scope: '/' });
```

Then add the `service-worker-loader` and `@flexis/workbox-webpack-plugin` to your webpack config. For example:

```js
module.exports = {
    module:  {
        rules: [{
            test: /serviceWorker\.js$/,
            use:  'service-worker-loader'
        }]
    },
    plugins: [
        new WorkboxPlugin(
            /serviceWorker\.js$/,
            workboxOptions
        )
    ]
}
```

## How it works?

This plugin generates `precache-manifest.js` file with [`workbox-webpack-plugin`](https://developers.google.com/web/tools/workbox/modules/workbox-webpack-plugin) and injects importing of manifest into matched ServiceWorker entry files.

```js
importScripts('precache-manifest.js');
// ... other ServiceWorker code
```

> **⚠ IMPORTANT ⚠**

Injecting of `importScripts` into ServiceWorker doesn't recalculate file hash. So, if you are using `service-worker-loader` with `filename` option, which contains `[hash]`, hash of ServiceWorker file, with `importScripts` and without it, will be the same. But in real life it doesn't matter:
- [You shouldn't apply HTTP cache to ServiceWorker files;](https://developers.google.com/web/updates/2018/06/fresher-sw#whats_changing)
- [Modern browsers by default doesn't use HTTP cache to download ServiceWorkers.](https://developers.google.com/web/updates/2018/06/fresher-sw)

## API

### `new WorkboxPlugin(test, options?)`

### `test`

`RegExp` to match ServiceWorker entries.

### `options`

Same as [`workbox-webpack-plugin` `InjectManifest` options](https://developers.google.com/web/tools/workbox/modules/workbox-webpack-plugin#full_injectmanifest_config), excluding `swSrc` and `swDest` options.
