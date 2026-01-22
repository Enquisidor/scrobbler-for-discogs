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
// IMPORTANT: Force React to resolve from mobile's node_modules to avoid duplicate React errors
config.resolver.extraNodeModules = {
  '@libs': libsPath,
  'react': path.resolve(projectRoot, 'node_modules', 'react'),
  'react-native': path.resolve(projectRoot, 'node_modules', 'react-native'),
  'react-redux': path.resolve(projectRoot, 'node_modules', 'react-redux'),
};

// Block libs/node_modules from being resolved to prevent duplicate packages
config.resolver.blockList = [
  new RegExp(path.resolve(workspaceRoot, 'libs', 'node_modules', 'react') + '/.*'),
  new RegExp(path.resolve(workspaceRoot, 'libs', 'node_modules', 'react-redux') + '/.*'),
];

module.exports = config;
