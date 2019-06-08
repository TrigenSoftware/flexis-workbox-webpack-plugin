import path from 'path';
import webpack from 'webpack';
import MemoryFs from 'memory-fs';
import {
	CleanWebpackPlugin
} from 'clean-webpack-plugin';
import HtmlPlugin from 'html-webpack-plugin';
import WorkboxPlugin from '../src/index';

const IS_TEST = process.env.NODE_ENV === 'test';

export const fs = new MemoryFs();
export const pathToArtifacts = path.resolve(__dirname, 'artifacts');

export default function compile(fixtureEntry, options = {}, writeToFs = false) {

	const webpackCompiler = webpack({
		devtool:      'inline-source-map',
		optimization: {
			minimize: false
		},
		context:      __dirname,
		entry:        `./${fixtureEntry}`,
		output:       {
			publicPath: '/',
			path:       pathToArtifacts,
			filename:   'bundle.[hash].js'
		},
		module:  {
			rules: [{
				test: /serviceWorker\.js$/,
				use:  {
					loader: 'service-worker-loader'
				}
			}]
		},
		plugins:      [
			!IS_TEST && new CleanWebpackPlugin(path.join(pathToArtifacts, '**', '*')),
			new HtmlPlugin({
				template: 'index.html'
			}),
			new WorkboxPlugin(
				/serviceWorker\.js$/,
				options
			)
		].filter(Boolean)
	});

	if (!writeToFs) {
		webpackCompiler.outputFileSystem = fs;
	}

	return new Promise((resolve, reject) => {

		webpackCompiler.run((err, stats) => {

			const hasErrors = stats && stats.hasErrors();

			if (err || hasErrors) {
				reject(hasErrors
					? new Error(stats.toJson().errors[0])
					: err
				);
				return;
			}

			resolve(stats.toJson());
		});
	});
}
