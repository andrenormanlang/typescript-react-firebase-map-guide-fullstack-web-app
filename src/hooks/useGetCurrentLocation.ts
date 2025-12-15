import { useEffect, useState } from "react";
import type { LatLngLiteral } from "../types/Geo.types";

/**
 * A hook for getting the current location of the device
 *
 * @returns the current position of the device, and error
 */
const useGetCurrentLocation = () => {
	const [position, setPosition] = useState<LatLngLiteral | undefined>(
		undefined
	);
	const [error, setError] = useState<GeolocationPositionError | null>(null);

	// get and use the current position of user

	const getCurrentLocation = () => {
		navigator.geolocation.getCurrentPosition(
			(position) => {
				// getting current long and lat
				const { latitude, longitude } = position.coords;
				setPosition({ lat: latitude, lng: longitude });
			},
			(error) => {
				console.error("Error getting user location:", error);
				setError(error);
			},
			{
				enableHighAccuracy: true, // Request high-precision location if available
				timeout: 10000, // Maximum time (in milliseconds) to wait for a response
				maximumAge: 0, // Maximum age (in milliseconds) of cached location data
			}
		);
	};

	useEffect(() => {
		getCurrentLocation();
	}, []);

	return {
		position,
		error,
	};
};

export default useGetCurrentLocation;
