// release.config.js

module.exports = {
  branches: ['lk/wf-test'], // Adjust this based on your branch setup
  tagFormat: '${version}',
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/exec', // Plugin to execute custom commands
      {
        prepareCmd: 'node version-bump.mjs ${nextRelease.version}', // Custom script to run before release
      },
    ],
	[
		"@semantic-release/github",
		{
		  "assets": [
			{ "path": "main.js", "label": "main.js" },
			{ "path": "manifest.json", "label": "manifest.json" }
		  ]
		},
	]
  ],
};
