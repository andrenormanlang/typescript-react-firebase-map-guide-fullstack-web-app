import React, { useEffect, useMemo, useState } from "react";
import { Form, ListGroup, ListGroupItem } from "react-bootstrap";
import useOnclickOutside from "react-cool-onclickoutside";
import { useSearchParams } from "react-router-dom";
import {
	nominatimSearch,
	nominatimSearchInSaoPaulo,
	type NominatimSearchResult,
} from "../../../services/nominatim";

type Props = {
	onClickedPlace: (result: NominatimSearchResult, placeName: string) => void;
	searchPlacesOfTypes?: string[] | undefined;
	placeHolderText: string;
	showInitialPlace?: boolean;
};

const PlacesAutoComplete: React.FC<Props> = ({
	onClickedPlace,
	searchPlacesOfTypes,
	placeHolderText,
	showInitialPlace,
}) => {
	const [showUl, setShowUl] = useState<boolean>(false);
	const [searchParams] = useSearchParams();
	const locality = searchParams.get("locality") ?? "São Paulo";

	const [ready] = useState(true);
	const [value, setValue] = useState("");
	const [results, setResults] = useState<NominatimSearchResult[]>([]);
	const [status, setStatus] = useState<"IDLE" | "OK" | "ERROR">("IDLE");

	const clearSuggestions = () => {
		setResults([]);
		setStatus("IDLE");
	};

	const ref = useOnclickOutside(() => {
		clearSuggestions();
		setShowUl(false);
		if (!showInitialPlace) {
			setValue(locality);
		}
	});

	const handleInputClick = () => {
		setValue("");
		setShowUl(true);
	};

	const filteredSuggestions = useMemo(() => {
		if (!results.length) return [];
		return results;
	}, [results]);

	const handleSelect = (result: NominatimSearchResult) => async () => {
		const display = result.display_name;
		setValue(display);
		clearSuggestions();
		setShowUl(false);

		const placeName =
			result.name ?? display.split(",")[0]?.trim() ?? display;
		onClickedPlace(result, placeName);
	};

	useEffect(() => {
		setShowUl(false);
		if (!showInitialPlace) {
			setValue(locality);
		}
	}, [setValue, locality, showInitialPlace]);

	useEffect(() => {
		// Keep prop for backwards compatibility; currently unused for Nominatim.
		void searchPlacesOfTypes;
	}, [searchPlacesOfTypes]);

	useEffect(() => {
		const query = value.trim();
		if (!showUl) return;
		if (query.length < 3) {
			clearSuggestions();
			return;
		}

		const timer = window.setTimeout(async () => {
			try {
				// Choose search strategy based on the requested locality
				const localityLower = locality.toLowerCase();
				let nextResults: NominatimSearchResult[] = [];
				if (
					localityLower.includes("são paulo") ||
					localityLower.includes("sao paulo")
				) {
					// use the bounded São Paulo helper for better local results
					nextResults = await nominatimSearchInSaoPaulo(query);
					// If the bounded SP search returned nothing, fall back to a wider Brazil search
					if (!nextResults.length) {
						nextResults = await nominatimSearch(query, {
							countryCodes: ["br"],
							acceptLanguage: "pt-BR",
						});
					}
				} else if (
					localityLower.includes("copenhagen") ||
					localityLower.includes("köbenhavn") ||
					localityLower.includes("københavn")
				) {
					nextResults = await nominatimSearch(query, {
						countryCodes: ["dk"],
						acceptLanguage: "da",
					});
				} else if (
					localityLower.includes("lund") ||
					localityLower.includes("malmö") ||
					localityLower.includes("malmo")
				) {
					nextResults = await nominatimSearch(query, {
						countryCodes: ["se"],
						acceptLanguage: "sv",
					});
				} else {
					// fallback to wider search (BR/SE/DK)
					nextResults = await nominatimSearch(query, {
						countryCodes: ["br", "se", "dk"],
						acceptLanguage: "pt-BR,en",
					});
				}
				setResults(nextResults);
				setStatus(nextResults.length ? "OK" : "IDLE");
			} catch {
				setStatus("ERROR");
				setResults([]);
			}
		}, 250);

		return () => window.clearTimeout(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [value, showUl]);

	return (
		<div ref={ref}>
			<Form.Control
				role="combobox"
				onClick={handleInputClick}
				value={value}
				onChange={(e) => setValue(e.target.value)}
				disabled={!ready}
				placeholder={placeHolderText}
			/>
			{status === "OK" && showUl && (
				<ListGroup
					style={{
						position: "absolute",
					}}
				>
					{filteredSuggestions.map((result) => {
						const display = result.display_name;
						const [main, ...rest] = display.split(",");
						const secondary = rest.join(",").trim();

						return (
							<ListGroupItem
								key={result.place_id}
								onClick={handleSelect(result)}
							>
								<strong>{main?.trim()}</strong>{" "}
								{secondary ? <small>{secondary}</small> : null}
							</ListGroupItem>
						);
					})}
				</ListGroup>
			)}
		</div>
	);
};

export default PlacesAutoComplete;
