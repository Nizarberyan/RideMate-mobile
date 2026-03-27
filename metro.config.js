const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// 1. Force the project root to be the current directory
config.projectRoot = projectRoot;

// 2. Add symlink support (needed for pnpm)
config.resolver.unstable_enableSymlinks = true;

// 3. Make sure all potential node_modules are watched
config.watchFolders = [projectRoot];

module.exports = config;
