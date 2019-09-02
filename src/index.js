import path from 'path';
import {
	ConcatSource,
	RawSource
} from 'webpack-sources';
import {
	getManifest
} from 'workbox-build';
import getDefaultConfig from 'workbox-webpack-plugin/build/lib/get-default-config';
import warnAboutConfig from 'workbox-webpack-plugin/build/lib/warn-about-config';
import getManifestEntriesFromCompilation from 'workbox-webpack-plugin/build/lib/get-manifest-entries-from-compilation';
import resolveWebpackUrl from 'workbox-webpack-plugin/build/lib/resolve-webpack-url';
import sanitizeConfig from 'workbox-webpack-plugin/build/lib/sanitize-config';
import stringifyManifest from 'workbox-webpack-plugin/build/lib/stringify-manifest';
import convertStringToAsset from 'workbox-webpack-plugin/build/lib/convert-string-to-asset';
import getAssetHash from 'workbox-webpack-plugin/build/lib/get-asset-hash';
import formatManifestFilename from 'workbox-webpack-plugin/build/lib/format-manifest-filename';
import relativeToOutputPath from 'workbox-webpack-plugin/build/lib/relative-to-output-path';
import {
	identifier
} from 'service-worker-loader';
import {
	onHook
} from './utils';

const ServiceWorkerCompiler = identifier || 'service-worker';

export default class WorkboxWebpackPlugin {

	constructor(test, config = {}) {

		if (!(test instanceof RegExp)) {
			throw new Error('WorkboxWebpackPlugin: `test` argument is required.');
		}

		this.test = test;
		this.config = {
			...getDefaultConfig(),
			...config
		};

		this.testRequest = this.testRequest.bind(this);
	}

	testRequest(request) {
		return this.test.test(request);
	}

	pushSwEntriesAssets(compilation, swEntriesAssets) {

		const {
			chunks
		} = compilation;

		chunks.forEach(({
			entryModule,
			files
		}) => {

			const hasSwDependency = Array
				.from(entryModule.buildInfo.fileDependencies)
				.some(this.testRequest);

			if (hasSwDependency && files) {
				swEntriesAssets.push(...files);
			}
		});

		return swEntriesAssets;
	}

	// https://github.com/GoogleChrome/workbox/blob/master/packages/workbox-webpack-plugin/src/inject-manifest.js
	async getManifest(compilation, swEntriesAssets) {

		const configWarning = warnAboutConfig(this.config);

		if (configWarning) {
			compilation.warnings.push(configWarning);
		}

		const publicPath = compilation.options.output.publicPath || '';
		const swEntriesAssetsUrls = swEntriesAssets.map(asset => resolveWebpackUrl(publicPath, asset));
		const entries = getManifestEntriesFromCompilation(compilation, this.config)
			.filter(({ url }) => !swEntriesAssetsUrls.includes(url)); // rm ServiceWorker entries
		const importScriptsArray = [...this.config.importScripts];
		const sanitizedConfig = sanitizeConfig.forGetManifest(this.config);

		if (Object.keys(sanitizedConfig).length > 0) {

			sanitizedConfig.globPatterns = sanitizedConfig.globPatterns || [];

			const {
				manifestEntries,
				warnings
			} = await getManifest(sanitizedConfig);

			compilation.warnings = compilation.warnings.concat(warnings || []);
			entries.push(...manifestEntries);
		}

		const manifestString = stringifyManifest(entries);
		const manifestAsset = convertStringToAsset(manifestString);
		const manifestHash = getAssetHash(manifestAsset);
		const manifestFilename = formatManifestFilename(
			this.config.precacheManifestFilename,
			manifestHash
		);
		const pathToManifestFile = relativeToOutputPath(
			compilation,
			path.join(this.config.importsDirectory, manifestFilename)
		);

		compilation.assets[pathToManifestFile] = manifestAsset;
		importScriptsArray.push(`${publicPath || ''}${pathToManifestFile.split(path.sep).join('/')}`);

		const importScriptsString = `importScripts(${
			importScriptsArray
				.map(JSON.stringify)
				.join(', ')
		});\n`;

		return importScriptsString;
	}

	injectImportScripts(compilation, swEntriesAssets, importScriptsString) {

		const {
			assets
		} = compilation;

		swEntriesAssets.forEach((entry) => {

			const asset = assets[entry];

			if (asset) {
				assets[entry] = new ConcatSource(
					new RawSource(importScriptsString),
					asset
				);
			}
		});
	}

	apply(compiler) {

		const swEntriesAssets = [];

		onHook(compiler, 'compilation', (compilation) => {

			onHook(compilation, 'childCompiler', (compiler, compilerName) => {

				if (compilerName !== ServiceWorkerCompiler) {
					return;
				}

				onHook(compiler, 'afterCompile', async (compilation) => {
					this.pushSwEntriesAssets(compilation, swEntriesAssets);
				}, true);
			});
		});

		onHook(compiler, 'emit', async (compilation) => {

			const importScriptsString = await this.getManifest(compilation, swEntriesAssets);

			this.injectImportScripts(compilation, swEntriesAssets, importScriptsString);
		}, true);
	}
}
