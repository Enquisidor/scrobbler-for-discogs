const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');
const libsPath = path.resolve(workspaceRoot, 'libs', 'src');

const config = getDefaultConfig(projectRoot);

// Watch additional folders in the monorepo (including libs folder)
config.watchFolders = [workspaceRoot, libsPath];

// Let Metro know where to resolve packages from
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Allow imports using @libs alias
config.resolver.extraNodeModules = {
  '@libs': libsPath,
};

module.exports = config;
