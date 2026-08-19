/* Cookie Clicker 3 — Base64 helpers for save encoding.
 *
 * Replaces the 2007-era WebToolkit implementation with native `btoa`/`atob`
 * plus TextEncoder/TextDecoder. The byte semantics are identical to the
 * original (input characters are UTF-8 encoded before Base64, and decoded
 * back), so 2.048 save strings remain compatible.
 */
const utf8Encoder = new TextEncoder();
const utf8Decoder = new TextDecoder('utf-8');

export const Base64 = {
	encode(input) {
		const bytes = utf8Encoder.encode(input);
		let binary = '';
		for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
		return btoa(binary);
	},
	decode(input) {
		const binary = atob(input.replace(/[^A-Za-z0-9+/=]/g, ''));
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
		return utf8Decoder.decode(bytes);
	},
};

// The engine resolves `Base64` as a free variable (module scope doesn't leak).
window.Base64 = Base64;
