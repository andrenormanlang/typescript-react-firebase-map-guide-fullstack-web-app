import PlaceModal from "./PlaceModal";
import SearchBox from "./SearchBox";
import { findAdressComponent } from "../../../helpers/locations";
import useGetCurrentLocation from "../../../hooks/useGetCurrentLocation";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Place } from "../../../types/Place.types";
import type { LatLngLiteral } from "../../../types/Geo.types";
import {
	getDistanceInMetresOrKm,
	getHaversineDistance,
} from "../../../helpers/distances";
import { getIconForCategory } from "../../../helpers/icons";
import { Alert } from "react-bootstrap";
import userIcon from "../../../assets/images/hangry-face-map.png";
import useStreamPlacesByLocality from "../../../hooks/useStreamPlacesByLocality";
import {
	getLatLngFromNominatim,
	nominatimReverse,
	nominatimSearch,
} from "../../../services/nominatim";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import * as L from "leaflet";

type Props = {
	placesFound: (places: Place[]) => void;
};

const iconCache = new Map<string, L.Icon>();

const getLeafletIcon = (url: string) => {
	const cached = iconCache.get(url);
	if (cached) return cached;
	const icon = L.icon({
		iconUrl: url,
		iconSize: [32, 32],
		iconAnchor: [16, 32],
	});
	iconCache.set(url, icon);
	return icon;
};

const MapViewUpdater = ({
	center,
	zoom,
}: {
	center: LatLngLiteral;
	zoom: number;
}) => {
	const map = useMap();

	useEffect(() => {
		map.setView([center.lat, center.lng], zoom);
	}, [center.lat, center.lng, zoom, map]);

	return null;
};

const HomeMap: React.FC<Props> = ({ placesFound }) => {
	const [searchParams, setSearchParams] = useSearchParams();
	const locality = searchParams.get("locality") ?? "São Paulo";
	const category = searchParams.get("category") ?? "Category";
	const supply = searchParams.get("supply") ?? "Supply";
	const { position: usersPosition, error: currentPositionError } =
		useGetCurrentLocation();
	const [center, setCenter] = useState<LatLngLiteral>({
		lat: -23.5505,
		lng: -46.6333,
	});
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [showPlaceModal, setShowPlaceModal] = useState(false);
	const [clickedPlace, setClickedPlace] = useState<Place | null>(null);

	const {
		data: places,
		getCollection,
		error,
	} = useStreamPlacesByLocality(category, supply);

	const getCurrentCity = async (position: LatLngLiteral | undefined) => {
		if (!position) return;
		try {
			const result = await nominatimReverse(position);
			const foundCity = findAdressComponent(result);
			setCenter(position);
			if (foundCity) {
				setSearchParams({
					locality: foundCity,
					category,
					supply,
				});
			}
		} catch (error: unknown) {
			setErrorMsg(
				error instanceof Error ? error.message : "Unexpected error"
			);
		}
	};

	// When the user's position is obtained, center the map on their coordinates.
	useEffect(() => {
		if (usersPosition) {
			setCenter(usersPosition);
		}
	}, [usersPosition]);

	const handleFilterCategoryChoice = (passedFilter: string) => {
		setSearchParams({
			locality,
			category: passedFilter,
			supply,
		});
	};

	const handleFilterSupplyChoice = (passedFilter: string) => {
		setSearchParams({
			locality,
			category,
			supply: passedFilter,
		});
	};

	const handleFindLocation = async () => {
		if (!usersPosition) {
			setErrorMsg(
				"Position not accessible. " + currentPositionError?.message
			);
			return;
		}

		await getCurrentCity(usersPosition);
	};

	const handleMarkerClick = (place: Place) => {
		setShowPlaceModal(true);
		if (!usersPosition) {
			setClickedPlace(place);
			return;
		}
		const distance = Math.round(
			getHaversineDistance(usersPosition, place.location)
		);
		const distanceText = getDistanceInMetresOrKm(distance);
		setClickedPlace({ ...place, distance, distanceText });
	};

	const queryCity = useCallback(async (city: string) => {
		try {
			const results = await nominatimSearch(city + ", Brasil");
			const first = results[0];
			if (!first) return;
			const { lat, lng } = getLatLngFromNominatim(first);
			setCenter({ lat, lng });
		} catch (error: unknown) {
			setErrorMsg(
				"No city was found. " +
					(error instanceof Error
						? error.message
						: "Unexpected error")
			);
		}
	}, []);

	useEffect(() => {
		if (!locality) return;
		queryCity(locality);
	}, [locality, queryCity]);

	useEffect(() => {
		if (places) placesFound(places);
	}, [places, placesFound]);

	useEffect(() => {
		if (locality) getCollection();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [locality, category, supply]);

	return (
		<div style={{ position: "relative" }}>
			<MapContainer
				center={[center.lat, center.lng]}
				zoom={14}
				className="map-container"
				style={{
					width: "100%",
					height: "calc(100vh - 130px)",
				}}
			>
				<TileLayer
					attribution="&copy; OpenStreetMap contributors"
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>
				<MapViewUpdater center={center} zoom={14} />

				{usersPosition && (
					<Marker
						position={[usersPosition.lat, usersPosition.lng]}
						icon={getLeafletIcon(userIcon)}
					/>
				)}

				{places?.map((place) => (
					<Marker
						key={place._id}
						position={[place.location.lat, place.location.lng]}
						icon={getLeafletIcon(
							getIconForCategory(place.category) ?? userIcon
						)}
						eventHandlers={{
							click: () => handleMarkerClick(place),
						}}
					/>
				))}
			</MapContainer>

			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					zIndex: 1000,
					display: "flex",
					justifyContent: "center",
				}}
			>
				<SearchBox
					handleFindLocation={handleFindLocation}
					passCategoryFilter={handleFilterCategoryChoice}
					passSupplyFilter={handleFilterSupplyChoice}
					categoryFilter={category}
					supplyFilter={supply}
				/>
			</div>

			{clickedPlace && (
				<PlaceModal
					onClose={() => setShowPlaceModal(false)}
					place={clickedPlace}
					show={showPlaceModal}
				/>
			)}

			{errorMsg && (
				<Alert
					style={{
						position: "absolute",
						left: "50%",
						transform: "translateX(-50%)",
						bottom: "4rem",
						zIndex: 1100,
					}}
					variant="danger"
				>
					An error occured. {errorMsg}
				</Alert>
			)}

			{error && (
				<Alert
					style={{
						position: "absolute",
						left: "50%",
						transform: "translateX(-50%)",
						bottom: "4rem",
						zIndex: 1100,
					}}
					variant="danger"
				>
					Places could not be loaded from the database. {error}
				</Alert>
			)}
		</div>
	);
};
export default HomeMap;
