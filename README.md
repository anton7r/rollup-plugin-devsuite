# rollup-plugin-devsuite

![DevSuiteLogo](https://raw.githubusercontent.com/anton7r/rollup-plugin-devsuite/HEAD/logo/DevSuite.png)

live-reloading devserver HMR plugin with hot css swaps.

If you are looking for javascript HMR look in to these tools instead: [Nollup](https://github.com/PepsRyuu/nollup), [Snowpack](https://www.snowpack.dev/), [Parcel](https://parceljs.org/) or [Vite](https://github.com/vitejs/vite)

## Features

- Lightweight

- Development server

- Css hot reloads

- Websocket tries to autoreconnect when the connection is lost

- Ease of use

## Configuring

`rollup.config.js`

```js
import devsuite from "rollup-plugin-devsuite";

const prod = !process.env.ROLLUP_WATCH;

export default {

    //...

    plugins: [

        //...

        !prod && devsuite({
            dir: "public", //default
            port: 3000, //default
            host: "localhost", //default
            index: "index.html", //default
            proxy: {} //default
        })
    ]
}
```

### Configuring proxies (Coming soon...)

The proxy can be used to map a route on the devserver for example to your api

Basically the following example maps `localhost:3000/api/hello` to `api.example.com/hello`

```js
...
proxy: {"/api/": "api.example.com"}
...
```

## Todo before 1.0

- implement proxies

## Release notes

### 0.1.3

Fix route matching with files in subfolders

### 0.1.2

fix configuration bug

### 0.1.1

fix logo

### 0.1.0

css hot reloading is now quite alot faster because the websocket server gives the client the updated css file entirely, so that the client wont have to fetch the updated content from the server.

### 0.0.2

add the option to change the index of the app

## Why

I felt like it is a chore to npm install 3 rollup-plugins for something that could be done with only one.

## License

MIT - Copyright (C) 2020 anton7r
