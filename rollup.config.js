const env = require("./index");

module.exports = {
	input: "./test/src/main.js",
	output: {
		dir: "./test/dist",
		format: "esm",
		freeze: false,
		chunkFileNames: "[name].js",
		entryFileNames: "[name].js",
		assetFileNames: "[name][extname]",
	},
	plugins: [
		env({
			MODE:"production",
			BASE_URL:".",
			PROD: true,
			DEV:false
		},{
			mode:"production",
			filter(key){
				if(key.startsWith("VITE_")){
					return true;
				}
				return false;
			}
		})
	]
}