import { Timestamp } from "firebase/firestore";
import type { LatLngLiteral } from "./Geo.types";

export type Location = {
	latitude: number;
	longitude: number;
};

export type Place = {
	_id: string;
	category: Category;
	// city: string
	createdAt: Timestamp;
	description: string;
	email?: string;
	facebook?: string;
	instagram?: string;
	isApproved: boolean;
	location: LatLngLiteral;
	name: string;
	streetAddress: string;
	supply: Supply;
	telephone?: string;
	uid: string;
	website?: string;
	distance?: number;
	distanceText?: string;
};

export type Category =
	| "Café"
	| "Pub"
	| "Restaurant"
	| "Fast Food"
	| "Kiosk/grill"
	| "Food Truck";

export type Supply =
	| "General Menu"
	| "Lunch"
	| "After Work"
	| "Dinner"
	| "Breakfast/Brunch";

export type SelectCategory = Category | "Category";

export type SelectSupply = Supply | "Supply";
