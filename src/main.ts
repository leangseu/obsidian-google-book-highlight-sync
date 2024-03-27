import { Plugin, addIcon } from "obsidian";
import GBookSyncSettingTab from "./view/setting-table";
import { GoogleBookHighlighSyncSettings } from "./helper/types";
import { bookHighlighSync } from "./googleApi/GoogleDrive";

const DEFAULT_SETTINGS: GoogleBookHighlighSyncSettings = {
	googleClientId: "",
	googleClientSecret: "",
	outputPath: "Books",
	outputFormat: `---
doc_name: {{doc_name}}
doc_url: {{doc_url}}
book_name: {{book_name}}
book_author: {{book_author}}
book_publisher: {{book_publisher}}
tags: book
---

{{markdown_content}}
`,
	lastUpdate: "",
	folderUrl: "",
};

const iconId = "google-book-sync";

const iconSvg = `
<g id="SVGRepo_bgCarrier" stroke-width="0" />
<g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#CCC"
	stroke-width="3.84">
	<defs>
		<style>.b{fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round}</style>
	</defs>
	<path class="b"
		d="M85.531 57.788c2.813 -1.515 4.758 -4.542 4.758 -7.788 -0.217 -3.244 -2.163 -6.271 -4.975 -7.788h0L31.671 11.715C30.375 10.85 28.646 10.417 26.913 10.417 22.802 10.417 19.125 13.229 18.26 16.906h0c-0.217 0.648 -0.217 1.515 -0.217 2.379v61.646c0 0.865 0 1.515 0.217 2.379v-0.217h0C19.344 86.771 22.802 89.583 26.913 89.583q2.594 0 4.542 -1.298h0z" />
	<path class="b"
		d="M31.671 11.715v35.879a1.042 1.042 0 0 0 1.779 0.738l10.313 -10.313 10.271 10.271a1.042 1.042 0 0 0 1.779 -0.735v-21.667" />
</g>
<g id="SVGRepo_iconCarrier">
	<path class="b"
		d="M85.531 57.788c2.813 -1.515 4.758 -4.542 4.758 -7.788 -0.217 -3.244 -2.163 -6.271 -4.975 -7.788h0L31.671 11.715C30.375 10.85 28.646 10.417 26.913 10.417 22.802 10.417 19.125 13.229 18.26 16.906h0c-0.217 0.648 -0.217 1.515 -0.217 2.379v61.646c0 0.865 0 1.515 0.217 2.379v-0.217h0C19.344 86.771 22.802 89.583 26.913 89.583q2.594 0 4.542 -1.298h0z" />
	<path class="b"
		d="M31.671 11.715v35.879a1.042 1.042 0 0 0 1.779 0.738l10.313 -10.313 10.271 10.271a1.042 1.042 0 0 0 1.779 -0.735v-21.667" />
</g>
`;

export default class GoogleBookHighlighSync extends Plugin {
	settings: GoogleBookHighlighSyncSettings;

	private static instance: GoogleBookHighlighSync;
	settingsTab: GBookSyncSettingTab;

	public static getInstance(): GoogleBookHighlighSync {
		return GoogleBookHighlighSync.instance;
	}

	async onload() {
		GoogleBookHighlighSync.instance = this;

		await this.loadSettings();

		addIcon(iconId, iconSvg);

		// This creates an icon in the left ribbon.
		this.addRibbonIcon(
			iconId,
			"Book highlight sync",
			bookHighlighSync,
		);

		this.addCommand({
            id: "google-book-sync",
            name: "Sync",
            callback: bookHighlighSync,
        });

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.settingsTab = new GBookSyncSettingTab(this.app, this);

		this.addSettingTab(this.settingsTab);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
