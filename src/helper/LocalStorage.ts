//===================
//GETTER
//===================
import manifest from "manifest.json";

const localStorageKey = manifest.id;

/**
 * getRefreshToken from LocalStorage
 * @returns googleRefreshToken
 */
export const getRefreshToken = (): string => {
	return window.localStorage.getItem(localStorageKey + ".RefreshToken") ?? "";
};


//===================
//SETTER
//===================

/**
 * set AccessToken into LocalStorage
 * @param googleAccessToken googleAccessToken
 * @returns googleAccessToken
 */
export const setAccessToken = (googleAccessToken: string): void => {
	window.localStorage.setItem(localStorageKey + ".AccessToken", googleAccessToken);
};

/**
 * set RefreshToken from LocalStorage
 * @param googleRefreshToken googleRefreshToken
 * @returns googleRefreshToken
 */
export const setRefreshToken = (googleRefreshToken: string): void => {
	if (googleRefreshToken == "undefined") return;
	window.localStorage.setItem(localStorageKey + ".RefreshToken", googleRefreshToken);
};
