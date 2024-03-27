// release.config.js

module.exports = {
  branches: ['lk/gh-action-test'], // Adjust this based on your branch setup
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/exec', // Plugin to execute custom commands
      {
        prepareCmd: 'node version-bump.mjs ${nextRelease.version}', // Custom script to run before release
      },
    ],
  ],
};