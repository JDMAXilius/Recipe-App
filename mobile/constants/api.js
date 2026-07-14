// Backend base URL. Configure per environment via EXPO_PUBLIC_API_URL in mobile/.env
// (e.g. your machine's LAN IP for a physical device, or the deployed URL).
// Falls back to localhost for simulators talking to a local backend.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5001/api";
