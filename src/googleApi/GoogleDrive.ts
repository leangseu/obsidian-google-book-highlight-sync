import { OAuth2Client } from "google-auth-library";
import { drive } from "@googleapis/drive";
import { docs } from '@googleapis/docs';
import { getRefreshToken } from "src/helper/LocalStorage";
import GoogleBookHighlighSync from "src/main";
import { processGDoc } from "src/helper/GDocProcessor";
import { Notice } from "obsidian";
import {moment} from "obsidian";

export function getFolderIdFromUrl(url: string): string {
	return new URL(url).pathname.split("/").pop();
}

export function getLastUpdateQuery(lastUpdate?: string): string {
	// if is development mode, undefined, empty or invalid return empty string
	// so the sync will redo every time.
	if (process.env.IS_DEV || !lastUpdate?.trim() || Number.isNaN(new Date(lastUpdate))) {
		return "";
	}

	return ` and modifiedTime > '${moment(lastUpdate).format()}'`;
}

export async function generateBookFolderUrl() {
	const plugin = GoogleBookHighlighSync.getInstance();

	const CLIENT_ID = plugin.settings.googleClientId;
	const CLIENT_SECRET = plugin.settings.googleClientSecret;

	const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET);

	oauth2Client.setCredentials({
		refresh_token: getRefreshToken(),
	});

	const driveClient = drive({
		version: "v3",
		auth: oauth2Client,
	});
	const res = await driveClient.files.list({
		q: `trashed=false and mimeType='application/vnd.google-apps.folder' and name='Play Books Notes'`,
	});

	try {
		const folderUrl = `https://drive.google.com/drive/folders/${res.data.files[0].id}`;

		plugin.settings.folderUrl = folderUrl;
		await plugin.saveSettings();
		return folderUrl;
	} catch (e) {
		new Notice("Can't find the folder.");
	}
}

export async function bookHighlighSync(): Promise<void> {
	new	Notice('Start google book highlight sync');
	const plugin = GoogleBookHighlighSync.getInstance();
	const app = plugin.app;

	const CLIENT_ID = plugin.settings.googleClientId;
	const CLIENT_SECRET = plugin.settings.googleClientSecret;

	const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET);

	oauth2Client.setCredentials({
		refresh_token: getRefreshToken(),
	});

	const driveClient = drive({
		version: "v3",
		auth: oauth2Client,
	});

	if (!plugin.settings.folderUrl) {
		await generateBookFolderUrl();
	}

	const folderId = getFolderIdFromUrl(plugin.settings.folderUrl);

	const lastUpdateString = getLastUpdateQuery(plugin.settings.lastUpdate);

	const res = await driveClient.files.list({
		q: `'${folderId}' in parents and trashed=false and mimeType='application/vnd.google-apps.document'${lastUpdateString}`,
	});
	const docsClient = docs("v1");

	for(const doc of res.data.files ) {
		const file = await docsClient.documents.get({
			documentId: doc.id,
			auth: oauth2Client,
		});

		const variables = await processGDoc(file.data);

		const outputPath = app.vault.getFolderByPath(
			plugin.settings.outputPath
		);
		if (!outputPath) {
			await app.vault.createFolder(plugin.settings.outputPath);
		}

		const filePath = `${plugin.settings.outputPath}/${variables.book_name.replace(/[:|;$%@"<>()+,]/g, "") + ".md"}`;

		new	Notice('Creating file ' + filePath);

		let newFile = app.vault.getFileByPath(filePath);

		if (!newFile) {
			newFile = await app.vault.create(filePath, "");
		}

		await app.vault.process(newFile, () => {
			let output = plugin.settings.outputFormat;
			Object.entries(variables).map(([key, value]) => {
				// output = output.replaceAll(`{{${key}}}`, value.replace(/[:]/g, ""));
				output = output.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value.replace(/[:]/g, ""));
			});

			return output;
		});
	}

	plugin.settings.lastUpdate = moment().format();
	await plugin.saveSettings();

	new Notice('Done google book highlight sync');
}
