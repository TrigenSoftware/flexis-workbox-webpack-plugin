import path from 'path';
import compile, {
	fs,
	pathToArtifacts
} from './compile';

describe('workbox-webpack-plugin', () => {

	it('should emit precache manifest and modificate service worker', async () => {

		const stats = await compile('serviceWorkerLoader.js', {});
		const precacheManifestName = stats.assets
			.find(({ name }) => name.startsWith('precache-manifest'))
			.name;
		const precacheManifest = fs.readFileSync(
			path.join(pathToArtifacts, precacheManifestName),
			'utf8'
		);
		const serviceWorker = fs.readFileSync(
			path.join(pathToArtifacts, 'serviceWorker.js'),
			'utf8'
		);

		expect(precacheManifest).toMatchSnapshot();
		expect(serviceWorker).toEqual(
			expect.stringMatching(/^importScripts\("\/precache-manifest\./)
		);
	});
});
