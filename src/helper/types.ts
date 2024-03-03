import type { Server } from 'http';

export type GoogleBookHighlighSyncSettings = {
	googleClientId: string;
	googleClientSecret: string;
	outputPath: string;
	outputFormat: string;

	// generated setting
	lastUpdate: string;
	folderUrl: string;
}

export type GDocProcessorOutput = {
	doc_name: string;
	doc_id: string;
	doc_url: string;
	book_name: string;
	book_author: string;
	book_publisher: string;
	markdown_content?: string;
}

export type AuthSession = {
	server?: Server,
	verifier?: string,
	challenge?: string,
	state?: string,
}
