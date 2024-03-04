// Credits go to YukiGasai's obsidian-calendar-plugin: https://github.com/YukiGasai/obsidian-google-calendar

/* eslint-disable @typescript-eslint/no-var-requires */
/*
	This file is used to authenticate the user to the google google cloud service 
	and refresh the access token if needed 
*/
import type { IncomingMessage, ServerResponse } from "http";
import http from 'http';
import { OAuth2Client } from "google-auth-library";

import GoogleBookHighlighSync from "./../main";
import {
	setAccessToken,
	setRefreshToken,
} from "../helper/LocalStorage";
import { Notice, Platform } from "obsidian";
import { AuthSession } from "src/helper/types";

const PORT = 42813;
const REDIRECT_URL = `http://127.0.0.1:${PORT}/callback`;
const REDIRECT_URL_MOBILE = `https://google-auth-obsidian-redirect.vercel.app/callback`;

let authSession: AuthSession = {
	server: null,
	verifier: null,
	challenge: null,
	state: null,
};

function generateState(): string {
	return (
		Math.random().toString(36).substring(2, 15) +
		Math.random().toString(36).substring(2, 15)
	);
}

async function generateVerifier(): Promise<string> {
	const array = new Uint32Array(56);
	await window.crypto.getRandomValues(array);
	return Array.from(array, (dec) => ("0" + dec.toString(16)).substr(-2)).join(
		""
	);
}

async function generateChallenge(verifier: string): Promise<string> {
	const data = new TextEncoder().encode(verifier);
	const hash = await window.crypto.subtle.digest("SHA-256", data);
	return btoa(String.fromCharCode(...new Uint8Array(hash)))
		.replace(/=/g, "")
		.replace(/\+/g, "-")
		.replace(/\//g, "_");
}

export async function StartLoginGoogleMobile(): Promise<void> {
	const plugin = GoogleBookHighlighSync.getInstance();

	const CLIENT_ID = plugin.settings.googleClientId;

	if (!authSession.state) {
		authSession.state = generateState();
		authSession.verifier = await generateVerifier();
		authSession.challenge = await generateChallenge(authSession.verifier);
	}

	const authUrl =
		"https://accounts.google.com/o/oauth2/v2/auth" +
		`?client_id=${CLIENT_ID}` +
		`&response_type=code` +
		`&redirect_uri=${REDIRECT_URL_MOBILE}` +
		`&prompt=consent` +
		`&access_type=offline` +
		`&state=${authSession.state}` +
		`&code_challenge=${authSession.challenge}` +
		`&code_challenge_method=S256` +
		`&scope=email%20profile%20https://www.googleapis.com/auth/calendar`;

	window.open(authUrl);
}

/**
 * Function to allow the user to grant the APplication access to his google calendar by OAUTH authentication
 *
 * Function will start a local server
 * User is redirected to OUATh screen
 * If authentication is successfully user is redirected to local server
 * Server will read the tokens and save it to local storage
 * Local server will shut down
 *
 */
export async function LoginGoogle(): Promise<void> {
	const plugin = GoogleBookHighlighSync.getInstance();

	const CLIENT_ID = plugin.settings.googleClientId;
	const CLIENT_SECRET = plugin.settings.googleClientSecret;

	if (!Platform.isDesktop) {
		new Notice("Can't use this OAuth method on this device");
		return;
	}

	// if (!settingsAreComplete()) return;

	if (!authSession.state) {
		authSession.state = generateState();
		authSession.verifier = await generateVerifier();
		authSession.challenge = await generateChallenge(authSession.verifier);
	}
	/**
	 * To use OAuth2 authentication, we need access to a CLIENT_ID, CLIENT_SECRET, AND REDIRECT_URI
	 * from the client_secret.json file. To get these credentials for your application, visit
	 * https://console.cloud.google.com/apis/credentials.
	 */
	const oauth2Client = new OAuth2Client(
		CLIENT_ID,
		CLIENT_SECRET,
		REDIRECT_URL
	);

	const scopes = [
		"https://www.googleapis.com/auth/drive.readonly",
		"https://www.googleapis.com/auth/documents.readonly",
	];

	// Generate a url that asks permissions for the Drive activity scope
	const authUrl = oauth2Client.generateAuthUrl({
		// 'online' (default) or 'offline' (gets refresh_token)
		access_type: "offline",
		/** Pass in the scopes array defined above.
		 * Alternatively, if only one scope is needed, you can pass a scope URL as a string */
		scope: scopes,
		// Enable incremental authorization. Recommended as a best practice.
		include_granted_scopes: true,
	});

	// Make sure no server is running before starting a new one
	if (authSession.server) {
		window.open(authUrl);
		return;
	}

	authSession.server = http
		.createServer(async (req: IncomingMessage, res: ServerResponse) => {
			try {
				if (req.url === "/") {
					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(
						"This is the custom server for google authentication."
					);
					return;
				} else if ((req.url || "").indexOf("/callback") < 0) return;
				// acquire the code from the querystring, and close the web server.
				const qs = new URL(req.url, `http://127.0.0.1:${PORT}`)
					.searchParams;
				const code = qs.get("code");
				const { tokens } = await oauth2Client.getToken(code);
				if (tokens?.refresh_token) {
					setRefreshToken(tokens.refresh_token);
					setAccessToken(tokens.access_token || "");
				}
				console.info("Tokens acquired.");
				res.end(
					"Authentication successful! Please return to obsidian."
				);
				authSession.server.close(() => {
					console.log("Server closed");
				});
				plugin.settingsTab.display();
			} catch (e) {
				console.log("Auth failed");

				authSession.server.close(() => {
					console.log("Server closed");
				});
			}
			authSession = {
				server: null,
				verifier: null,
				challenge: null,
				state: null,
			};
		})
		.listen(PORT, () => {
			// open the browser to the authorize url to start the workflow
			window.open(authUrl);
		});
}
