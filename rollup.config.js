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
		manualChunks(id) {//提取常用公共库
			id = id.replace(/\\/g, "/");
			if(!id.startsWith("/") && !(/^[A-Z]{1}:/.test(id))) {
				return "runtime";
			}
			return;
		}
	},
	plugins: [
		env({
			MODE:"production",
			BASE_URL:"",
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

