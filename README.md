# rollup-plugin-devsuite

live-reloading devserver plugin with hot css swaps.

in heavy development...

- needs proxies implemented...
- instead of listening for file changes in the dist directory, it could use rollup build hooks.

instead of needing to install `rollup-plugin-serve`, `rollup-plugin-livereload`

you only need to install `rollup-plugin-devsuite` and you also get hotcss swaps.

Note: this does not have hot module reloads, if you would like to have that use [nollup](https://github.com/PepsRyuu/nollup) instead.

## Configuring

!prod && devsuite({ dir:"public", port:3000, host:"localhost" })

## Why

I felt like it is a chore to npm install 3 rollup-plugins for something that could be done with only one.

## License

MIT - Copyright (C) 2020 anton7r
