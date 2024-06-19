# Env Variables

The plugin exposes env variables on the special import.meta.env object.

## Config

```javascript
const env = require("rollup-plugin-import-meta-env");
```

```javascript
env({
    ...process.env,
    PROD: true,
    DEV: false
})
```

## Before

```javascript
console.log(import.meta.env.DEV);
```

## After

```javascript
console.log(false);
```

# Remove unuse variables by tree-shaking.

To prevent accidentally leaking env variables to the client, it is therefore recommend to always reference them using the full static string. For example, dynamic key access will not recommend.

```
DB_PASSWORD=foobar
VITE_SOME_KEY=123
```

## Before

```javascript
// GOOD
console.log(import.meta.env.VITE_SOME_KEY);
```

## After

```javascript
// GOOD
console.log("123");
```

## Before

```javascript
// BAD
var env=import.meta.env;
console.log(env.VITE_SOME_KEY);
```

## After

```javascript
// BAD
var env={
	DB_PASSWORD: "foobar",
	VITE_SOME_KEY: "123"
};
console.log(env.VITE_SOME_KEY);
```

# Filter exposed variables

To prevent accidentally leaking env variables to the client, config function to filter exposed variables. Only variables prefixed with VITE_ are exposed by e.g. the following config.

```javascript
env({
    PROD: true,
    DEV:false
},{
    filter(key){
        if(key.startsWith("VITE_")){
            return true;
        }
        return false;
    }
})
```

# Other Options

* include
* exclude
* sourcemap

```javascript
env({
    PROD: true,
    DEV:false
},{
    filter(key){
        if(key.startsWith("VITE_")){
            return true;
        }
        return false;
    },
    sourcemap: true,
    exclude: "node_modules/**"
})
```