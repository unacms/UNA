const { getDefaultConfig } = require('expo/metro-config');
const { resolve } = require('metro-resolver');
const { withUniwindConfig } = require('uniwind/metro');

const config = withUniwindConfig(getDefaultConfig(__dirname), {
  cssEntryFile: './global.combined.css',
  polyfills: { rem: 16 },
});

// Workaround for uniwind/metro issue #353
// https://github.com/uni-stack/uniwind/issues/353
// Defeats infinite recursion when uniwind's path detection fails
// (Windows backslash/forwardslash mismatch, monorepos, symlinks).

const isUniwindInternal = (originModulePath) => {
  if (!originModulePath) return false;
  const normalized = String(originModulePath).replace(/\\/g, '/');
  return normalized.includes('/node_modules/uniwind/') ||
         normalized.includes('/uniwind/dist/') ||
         normalized.includes('/uniwind/src/');
};

const uniwindResolveRequest = config.resolver?.resolveRequest;

config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    // Если запрос идёт ИЗНУТРИ uniwind — пускаем через родной Metro,
    // обходя uniwind-резолвер. Это разрывает цикл
    // react-native -> uniwind/components -> react-native -> ...
    if (isUniwindInternal(context.originModulePath)) {
      return resolve(context, moduleName, platform);
    }
    if (typeof uniwindResolveRequest === 'function') {
      return uniwindResolveRequest(context, moduleName, platform);
    }
    return resolve(context, moduleName, platform);
  },
};

module.exports = config;