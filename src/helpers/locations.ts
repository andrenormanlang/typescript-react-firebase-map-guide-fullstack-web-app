import type { NominatimReverseResult } from "../services/nominatim";

/**
 * Extract a locality/city name from a Nominatim reverse-geocode response.
 */
export const findAdressComponent = (result: NominatimReverseResult) => {
	const address = result.address;
	if (!address) return;

	return (
		address.city ??
		address.town ??
		address.village ??
		address.municipality ??
		address.county
	);
};
