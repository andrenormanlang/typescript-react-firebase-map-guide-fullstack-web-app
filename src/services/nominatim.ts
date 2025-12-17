import type { LatLngLiteral } from "../types/Geo.types";

export type NominatimSearchResult = {
	place_id: number;
	osm_id?: number;
	osm_type?: string;
	lat: string;
	lon: string;
	display_name: string;
	name?: string;
	class?: string;
	type?: string;
	address?: Record<string, string>;
	boundingbox?: [string, string, string, string];
};

export type NominatimReverseResult = {
	lat: string;
	lon: string;
	display_name: string;
	address?: {
		city?: string;
		town?: string;
		village?: string;
		municipality?: string;
		county?: string;
		state?: string;
		suburb?: string;
		neighbourhood?: string;
	};
};

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

const DEFAULT_COUNTRY_CODES = ["br", "se", "dk"];
const DEFAULT_ACCEPT_LANGUAGE = "pt-BR,en";

const toLatLngLiteral = (
	lat: string | number,
	lon: string | number
): LatLngLiteral => ({
	lat: typeof lat === "string" ? Number.parseFloat(lat) : lat,
	lng: typeof lon === "string" ? Number.parseFloat(lon) : lon,
});

export const nominatimSearch = async (
	query: string,
	options?: {
		countryCodes?: string[];
		acceptLanguage?: string;
	}
): Promise<NominatimSearchResult[]> => {
	const url = new URL(`${NOMINATIM_BASE_URL}/search`);
	url.searchParams.set("format", "jsonv2");
	url.searchParams.set("q", query);
	url.searchParams.set("addressdetails", "1");
	// increase limit to improve POI coverage for short name queries
	url.searchParams.set("limit", "50");
	url.searchParams.set(
		"countrycodes",
		(options?.countryCodes ?? DEFAULT_COUNTRY_CODES).join(",")
	);
	url.searchParams.set(
		"accept-language",
		options?.acceptLanguage ?? DEFAULT_ACCEPT_LANGUAGE
	);

	const response = await fetch(url.toString(), {
		headers: {
			Accept: "application/json",
		},
	});

	if (!response.ok) {
		throw new Error(`Nominatim search failed (${response.status})`);
	}

	return (await response.json()) as NominatimSearchResult[];
};

export const nominatimSearchInSaoPaulo = async (
	query: string
): Promise<NominatimSearchResult[]> => {
	const url = new URL(`${NOMINATIM_BASE_URL}/search`);
	url.searchParams.set("format", "jsonv2");
	url.searchParams.set("q", query);
	url.searchParams.set("addressdetails", "1");
	// increase limit to improve POI coverage inside the São Paulo viewbox
	url.searchParams.set("limit", "50");
	url.searchParams.set("countrycodes", "br");
	url.searchParams.set("accept-language", "pt-BR");
	// Rough bounding box for São Paulo metro area: left, top, right, bottom
	url.searchParams.set(
		"viewbox",
		"-46.825514,-23.356603,-46.365052,-24.008814"
	);
	url.searchParams.set("bounded", "1");

	const response = await fetch(url.toString(), {
		headers: {
			Accept: "application/json",
		},
	});

	if (!response.ok) {
		throw new Error(`Nominatim search failed (${response.status})`);
	}

	return (await response.json()) as NominatimSearchResult[];
};

export const nominatimReverse = async (
	position: LatLngLiteral
): Promise<NominatimReverseResult> => {
	const url = new URL(`${NOMINATIM_BASE_URL}/reverse`);
	url.searchParams.set("format", "jsonv2");
	url.searchParams.set("lat", String(position.lat));
	url.searchParams.set("lon", String(position.lng));
	url.searchParams.set("addressdetails", "1");
	url.searchParams.set("accept-language", "pt-BR");

	const response = await fetch(url.toString(), {
		headers: {
			Accept: "application/json",
		},
	});

	if (!response.ok) {
		throw new Error(`Nominatim reverse failed (${response.status})`);
	}

	return (await response.json()) as NominatimReverseResult;
};

export const getLatLngFromNominatim = (result: {
	lat: string;
	lon: string;
}): LatLngLiteral => {
	return toLatLngLiteral(result.lat, result.lon);
};
