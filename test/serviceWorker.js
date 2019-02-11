/* eslint-env serviceworker */
import precaching from 'workbox-precaching';

precaching.precacheAndRoute(self.__precacheManifest);

setInterval(() => {
	postMessageToAll({
		action:  'ping',
		payload: self.__precacheManifest
	});
}, 2000);

self.addEventListener('install', () => {
	postMessageToAll({
		action: 'install'
	});
});

self.addEventListener('activate', () => {
	postMessageToAll({
		action:  'activate',
		payload: self.__precacheManifest
	});
});

self.addEventListener('fetch', (event) => {
	postMessageToAll({
		action:  'fetch',
		payload: event.request.url
	});
});

async function postMessageToAll(message) {

	const clients = await self.clients.matchAll();

	return Promise.all(
		clients.map(client => client.postMessage(message))
	);
}
