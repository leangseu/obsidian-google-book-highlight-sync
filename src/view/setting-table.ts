import { App, Platform, PluginSettingTab, Setting } from "obsidian";
import { LoginGoogle, StartLoginGoogleMobile } from "src/googleApi/GoogleAuth";
import {
	bookHighlighSync,
	generateBookFolderUrl,
} from "src/googleApi/GoogleDrive";
import { FolderSuggest } from "src/helper/FolderSuggester";
import {
	getRefreshToken,
	setAccessToken,
	setRefreshToken,
} from "src/helper/LocalStorage";
import GoogleBookHighlighSync from "src/main";

export default class GBookSyncSettingTab extends PluginSettingTab {
	plugin: GoogleBookHighlighSync;

	constructor(app: App, plugin: GoogleBookHighlighSync) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		const isLoggedIn = getRefreshToken();

		new Setting(containerEl).setName('Google Authentication').setHeading();

		new Setting(containerEl)
			.setName("Client Id")
			.setDesc("Google client id")
			.addText((text) =>
				text
					.setPlaceholder("Enter your client id")
					.setValue(this.plugin.settings.googleClientId)
					.onChange(async (value) => {
						this.plugin.settings.googleClientId = value.trim();
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Client secret")
			.setDesc("Google client secret")
			.addText((text) => {
				text.inputEl.type = 'password'
				text
					.setPlaceholder("Enter your client secret")
					.setValue(this.plugin.settings.googleClientSecret)
					.onChange(async (value) => {
						this.plugin.settings.googleClientSecret = value.trim();
						await this.plugin.saveSettings();
					})
			});

		new Setting(containerEl)
			.setName("Login with Google")
			.addButton((button) => {
				button
					.setButtonText(isLoggedIn ? "Logout" : "Login")
					.onClick(() => {
						if (isLoggedIn) {
							setRefreshToken("");
							setAccessToken("");
							this.hide();
							this.display();
						} else {
							if (Platform.isMobileApp) {
								StartLoginGoogleMobile();
							} else {
								LoginGoogle();
							}
						}
					});
			});

		if (isLoggedIn) {
			new Setting(containerEl).addButton((button) => {
				button
					.setButtonText("Start sync")
					.setClass("mod-cta")
					.setDisabled(!isLoggedIn)
					.onClick(async () => {
						await bookHighlighSync();
						this.hide();
						this.display();
					});
			});
		}

		new Setting(containerEl).setName("Output path").addSearch((search) => {
			new FolderSuggest(this.app, search.inputEl);
			search
				.setPlaceholder("Enter the folder")
				.setValue(this.plugin.settings.outputPath)
				.onChange(async (value) => {
					this.plugin.settings.outputPath = value;
					await this.plugin.saveSettings();
				});
		});

		new Setting(containerEl)
			.setName("Output format")
			// .setDesc("Output Format")
			.addTextArea((text) =>
				text
					.setPlaceholder("Enter output path")
					.setValue(this.plugin.settings.outputFormat)
					.onChange(async (value) => {
						this.plugin.settings.outputFormat = value.trim();
						await this.plugin.saveSettings();
					})
					.inputEl.setCssStyles({
						width: "300px",
						height: "300px",
					})
			);

		new Setting(containerEl).setName('Generated values').setHeading();

		new Setting(containerEl)
			.setName("Last updated")
			.setDesc("Empty this to completely resync the note")
			.addText((text) =>
				text
					.setPlaceholder("Last updated")
					.setValue(this.plugin.settings.lastUpdate)
					.onChange(async (value) => {
						this.plugin.settings.lastUpdate = value.trim();
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Google Play Notes folder URL")
			.addText((text) =>
				text
					.setPlaceholder(
						"https://drive.google.com/drive/folders/..."
					)
					.setValue(this.plugin.settings.folderUrl)
					.onChange(async (value) => {
						this.plugin.settings.folderUrl = value.trim();
						await this.plugin.saveSettings();
					})
			)
			.addButton((button) =>
				button
					.setButtonText("Get folder URL")
					.setClass('mod-cta')
					.onClick(async () => {
						await generateBookFolderUrl();
						this.hide();
						this.display();
					})
			);
	}
}
