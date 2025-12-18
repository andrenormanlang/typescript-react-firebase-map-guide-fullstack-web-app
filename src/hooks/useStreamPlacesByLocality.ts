import { QueryConstraint, where } from "firebase/firestore";
import useStreamCollection from "./useStreamCollection";
import { placesCol } from "../services/firebase";
import { Place } from "../types/Place.types";

const useStreamPlacesByLocality = (
	city: string,
	category: string,
	supply: string
) => {
	// Firestore limitation: only ONE `in`/`array-contains-any` filter per query.
	// So we build a query with equality filters only when a filter is chosen.
	const constraints: QueryConstraint[] = [where("isApproved", "==", true)];

	// Only filter by city if we have a valid city selected
	// This allows older documents without the city field to still show
	if (city && city !== "City") {
		constraints.push(where("city", "==", city));
	}

	if (category !== "Category") {
		constraints.push(where("category", "==", category));
	}

	if (supply !== "Supply") {
		constraints.push(where("supply", "==", supply));
	}

	console.log("[useStreamPlacesByLocality] Query constraints:", {
		city,
		category,
		supply,
		constraintsCount: constraints.length,
	});

	return useStreamCollection<Place>(placesCol, ...constraints);
};

export default useStreamPlacesByLocality;
