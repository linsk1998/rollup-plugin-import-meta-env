const path = require('path');
const dotenv = require('dotenv');

const estreeWalker = require('estree-walker');
const MagicString = require('magic-string');
const pluginutils = require('@rollup/pluginutils');

const PREFIX = `\0plugin:import-meta-env`;

function createPlugin(env,options) {
	if (!env) env = {};
	if (!options) options = {};
	var { include, exclude, sourcemap, mode } = options
	var filter = pluginutils.createFilter(include, exclude);
	var sourceMap = options.sourceMap !== false && sourcemap !== false;

	var context = options.context || process.cwd();
	var basePath = path.resolve(context, "./.env");
	var envBase = dotenv.config({ path: basePath, debug: process.env.DEBUG }).parsed;
	Object.assign(env, envBase);
	try {
		var baseLocalPath = basePath + ".local";
		var envLocal = dotenv.config({ path: baseLocalPath, debug: process.env.DEBUG }).parsed;
		Object.assign(env, envLocal);
	} catch { }
	if (mode) {
		try {
			var modePath = basePath + "." + mode;
			var envMode = dotenv.config({ path: modePath, debug: process.env.DEBUG }).parsed;
			Object.assign(env, envMode);
			var modeLocalPath = basePath + "." + mode;
			var envModeLocal = dotenv.config({ path: modeLocalPath, debug: process.env.DEBUG }).parsed;
			Object.assign(env, envModeLocal);
		} catch { }
	}

	return {
		name: "plugin-import-meta-env",
		resolveId(id, importer) {
			if (id == PREFIX) return PREFIX;
			return null;
		},
		load(id) {
			if (id == PREFIX) {
				var keys = Object.keys(env);
				if (options.filter) {
					keys = keys.filter(options.filter)
				}
				return keys.map(key => `export var ${key}=${JSON.stringify(env[key])};`).join("\n")
			}
		},
		transform(code, id) {
			if (!filter(id)) { return null; }
			var ast = null;
			try {
				ast = this.parse(code);
			} catch (err) {
				this.warn({
					code: 'PARSE_ERROR',
					message: ("rollup-plugin-import-meta-env: failed to parse " + id + ". Consider restricting the plugin to particular files via options.include")
				});
			}
			if (!ast) {
				return null;
			}
			var scope = pluginutils.attachScopes(ast, 'scope');
			var magicString = new MagicString(code);
			var scopeName;
			var scopeIndex = 0;

			estreeWalker.walk(ast, {
				enter: function enter(node, parent) {
					if (sourceMap) {
						magicString.addSourcemapLocation(node.start);
						magicString.addSourcemapLocation(node.end);
					}
					if (node.scope) {
						scope = node.scope;
					}
					if (node.type === "MemberExpression") {
						var property = node.property;
						if (property) {
							if (property.type === "Identifier") {
								if (property.name === "env") {
									let object = node.object;
									if (object && object.type === "MetaProperty") {
										do {
											scopeIndex++;
											scopeName = `__env_${scopeIndex}`;
										} while (scopeName in scope.declarations);
										magicString.overwrite(node.start, node.end, scopeName);
									}
								}
							}
						}
					}
				},
				leave: function leave(node) {
					if (node.scope) {
						scope = scope.parent;
					}
				}
			});
			if (scopeName) {
				magicString.prepend(`import * as ${scopeName} from ${JSON.stringify(PREFIX)};`);
				return {
					code: magicString.toString(),
					map: sourceMap ? magicString.generateMap({ hires: true }) : null
				};
			}
			return {
				code: code,
				ast: ast,
				map: sourceMap ? magicString.generateMap({ hires: true }) : null
			};
		}
	}
}

createPlugin.default = createPlugin
module.exports = createPlugin