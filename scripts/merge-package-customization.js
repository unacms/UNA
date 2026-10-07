// Merges customization configs (package.next.js, package.expo.js) into apps' package.json
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const configPath = path.join(root, 'packages/app/customization/config');

const nextCustom = require(path.join(configPath, 'package.next.js'));
const expoCustom = require(path.join(configPath, 'package.expo.js'));

const merge = (base, custom) => ({
  ...base,
  dependencies: { ...base.dependencies, ...(custom?.dependencies || {}) },
});

const nextPkg = require(path.join(root, 'apps/next/package.json'));
const expoPkg = require(path.join(root, 'apps/expo/package.json'));

const mergedNext = merge(nextPkg, nextCustom);
const mergedExpo = merge(expoPkg, expoCustom);

fs.writeFileSync(
  path.join(root, 'apps/next/package.json'),
  JSON.stringify(mergedNext, null, 2)
);
fs.writeFileSync(
  path.join(root, 'apps/expo/package.json'),
  JSON.stringify(mergedExpo, null, 2)
);
