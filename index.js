const estreeWalker = require('estree-walker');
const MagicString = require('magic-string');
const pluginutils = require('@rollup/pluginutils');

const PREFIX = `\0plugin:import-meta-env`;

function createPlugin(env, options) {
	if (!options) options = {};
	var { include, exclude, filter, sourcemap } = options
	filter = filter || pluginutils.createFilter(include, exclude);
	var sourceMap = options.sourceMap !== false && sourcemap !== false;

	return {
		name: "plugin-import-meta-env",
		resolveId(id, importer) {
			if (id == PREFIX) return PREFIX;
			return null;
		},
		load(id) {
			if (id == PREFIX) {
				var keys = Object.keys(env);
				return keys.map(key => {
					if (/^[a-zA-Z_$]\w*$/.test(key)) {
						return `export var ${key}=${JSON.stringify(env[key])};`
					}
					return "";
				}).join("\n");
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

			var imports = new Set();
			ast.body.forEach(function (node) {
				if (node.type === 'ImportDeclaration') {
					node.specifiers.forEach(function (specifier) {
						imports.add(specifier.local.name);
					});
				}
			});

			var scope = pluginutils.attachScopes(ast, 'scope');
			var magicString = new MagicString(code);
			var scopeNames = new Set();
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
										var scopeName = `__env_${scopeIndex}`;
										while (imports.has(scopeName) || scope.contains(scopeName)) {
											scopeIndex++;
											scopeName = `__env_${scopeIndex}`;
										}
										scopeNames.add(scopeName);
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
			if (scopeNames.size) {
				magicString.prepend(Array.from(scopeNames).map(scopeName => `import * as ${scopeName} from ${JSON.stringify(PREFIX)};`).join(""));
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