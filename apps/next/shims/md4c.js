'use strict';

// Loaded instead of ./wasm/md4c (see next.config.js). Real Emscripten bundle via alias.
const factory = require('md4c-emscripten-real');

let createMd4cModule;
if (typeof factory === 'function') {
    createMd4cModule = factory;
} else if (factory && typeof factory.default === 'function') {
    createMd4cModule = factory.default;
} else {
    throw new Error(
        '[neo/md4c shim] Emscripten factory missing — got ' + typeof factory
    );
}

module.exports = createMd4cModule;
module.exports.default = createMd4cModule;
