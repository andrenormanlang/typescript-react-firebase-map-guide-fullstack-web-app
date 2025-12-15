import { Place } from "../types/Place.types";
import type { LatLngLiteral } from "../types/Geo.types";

const rad = function (x: number) {
	return (x * Math.PI) / 180;
};

export const getHaversineDistance = (p1: LatLngLiteral, p2: LatLngLiteral) => {
	const R = 6378137; // Earth’s mean radius in meter
	const dLat = rad(p2.lat - p1.lat);
	const dLong = rad(p2.lng - p1.lng);
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(rad(p1.lat)) *
			Math.cos(rad(p2.lat)) *
			Math.sin(dLong / 2) *
			Math.sin(dLong / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	const d = R * c;
	return d; // returns the distance in meter
};

export const getDistanceInMetresOrKm = (distance: number | null) => {
	if (!distance) return;
	if (distance < 1000) return distance + " meters";
	return (distance / 1000).toFixed(1) + " kms";
};

export const getPlacesWithDistances = (
	position: LatLngLiteral,
	places: Place[]
) => {
	return places
		.map((place) => {
			const distance = Math.round(
				getHaversineDistance(position, place.location)
			);
			const distanceText = getDistanceInMetresOrKm(distance);
			return { ...place, distance, distanceText };
		})
		.sort((a, b) => a.distance - b.distance);
};
