import fs from "node:fs";
import process from "node:process";

import axios from "axios";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const usage = () => {
	console.log(
		`\nSeed Firestore with places for the app.\n\nRequired:\n  - Provide a Firebase service account credential via one of:\n      GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/serviceAccount.json\n      FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'\n      --creds /absolute/path/to/serviceAccount.json\n\nOptions:\n  --creds <path>   Path to serviceAccount.json (alternative to env vars)\n  --count <n>      Total places to seed (default: 100)\n  --real           Fetch real places from OpenStreetMap (default: enabled)\n  --static         Use the built-in static sample list\n  --delete-seed    Deletes only documents created by this script (where uid=seed-script)\n\nExamples (PowerShell):\n  $env:GOOGLE_APPLICATION_CREDENTIALS='C:\\secrets\\serviceAccount.json'\n  npm run seed:firestore\n\n  # Or pass creds directly\n  npm run seed:firestore -- --creds 'C:\\secrets\\serviceAccount.json'\n\n  # If npm drops flags, you can pass the JSON path as the first argument\n  npm run seed:firestore -- 'C:\\secrets\\serviceAccount.json'\n\n  # Seed 120 real places\n  npm run seed:firestore -- --real --count 120\n\n  # Seed the built-in demo list\n  npm run seed:firestore -- --static\n\n  # Delete only seeded docs\n  npm run seed:firestore -- --delete-seed\n`
	);
};

const getServiceAccount = (args) => {
	const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || null;
	const npmCreds = process.env.npm_config_creds || null;
	const credsArg = getArgValue(args, "--creds");
	if (credsArg) {
		return readJsonFile(credsArg);
	}

	// Some npm versions/configs may drop the flag and only pass the path.
	const firstArg = args?.[0];
	if (
		firstArg &&
		typeof firstArg === "string" &&
		!firstArg.startsWith("-") &&
		firstArg.toLowerCase().endsWith(".json") &&
		fs.existsSync(firstArg)
	) {
		return readJsonFile(firstArg);
	}

	if (credsPath) {
		return readJsonFile(credsPath);
	}
	if (npmCreds && fs.existsSync(npmCreds)) {
		return readJsonFile(npmCreds);
	}
	const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
	if (json) return JSON.parse(json);
	return null;
};

const getNpmFlag = (name) => {
	const key = `npm_config_${name}`;
	const value = process.env[key];
	if (!value) return false;
	return value === "true" || value === "1" || value === "";
};

const getNpmValue = (name) => {
	const key = `npm_config_${name}`;
	return process.env[key] || null;
};

function getArgValue(args, name) {
	const idx = args.indexOf(name);
	if (idx === -1) return null;
	return args[idx + 1] ?? null;
}

const readJsonFile = (path) => {
	const raw = fs.readFileSync(path, "utf8");
	return JSON.parse(raw);
};

const toAdminCertObject = (serviceAccount) => {
	const projectId = serviceAccount.project_id ?? serviceAccount.projectId;
	const clientEmail =
		serviceAccount.client_email ?? serviceAccount.clientEmail;
	const privateKey = serviceAccount.private_key ?? serviceAccount.privateKey;
	return { projectId, clientEmail, privateKey };
};

const assertValidServiceAccount = (serviceAccount) => {
	if (!serviceAccount || typeof serviceAccount !== "object") {
		throw new Error("Service account JSON is missing or invalid JSON.");
	}

	// User ADC files often have type=authorized_user and will not work here.
	if (serviceAccount.type && serviceAccount.type !== "service_account") {
		throw new Error(
			`Expected a service account JSON (type=service_account), got type=${String(
				serviceAccount.type
			)}.`
		);
	}

	const { projectId, clientEmail, privateKey } =
		toAdminCertObject(serviceAccount);
	if (!projectId || !clientEmail || !privateKey) {
		throw new Error(
			"Service account JSON is missing required fields (project_id/client_email/private_key)."
		);
	}
};

const normalize = (value) =>
	value
		.trim()
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/ø/g, "o")
		.replace(/æ/g, "ae")
		.replace(/å/g, "a");

const slugify = (value) =>
	normalize(value)
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");

const SEED_UID = "seed-script";

const DEFAULT_TOTAL_COUNT = 100;

const CITY_BBOX = {
	"Sao Paulo": {
		south: -23.8,
		west: -46.9,
		north: -23.4,
		east: -46.4,
	},
	Malmö: {
		south: 55.52,
		west: 12.9,
		north: 55.65,
		east: 13.2,
	},
	Copenhagen: {
		south: 55.6,
		west: 12.45,
		north: 55.75,
		east: 12.7,
	},
};

const hashString = (value) => {
	let hash = 2166136261;
	for (let i = 0; i < value.length; i++) {
		hash ^= value.charCodeAt(i);
		hash = Math.imul(hash, 16777619);
	}
	return hash >>> 0;
};

const pick = (arr, seed) => arr[seed % arr.length];

const mapCategoryFromOsm = (tags) => {
	const amenity = tags?.amenity;
	const shop = tags?.shop;

	if (amenity === "cafe") return "Café";
	if (amenity === "restaurant") return "Restaurant";
	if (amenity === "fast_food" || amenity === "food_court") return "Fast Food";
	if (amenity === "pub" || amenity === "bar" || amenity === "biergarten")
		return "Pub";
	if (shop === "kiosk") return "Kiosk/grill";

	return "Restaurant";
};

const mapSupplyFromCategory = (category, seed) => {
	const cafe = ["Breakfast/Brunch", "Lunch", "General Menu"];
	const pub = ["After Work", "Dinner", "General Menu"];
	const fast = ["Lunch", "Dinner", "General Menu"];
	const restaurant = ["Lunch", "Dinner", "General Menu"];
	const kiosk = ["General Menu", "Lunch", "Dinner"];
	const truck = ["General Menu", "Lunch", "Dinner"];

	switch (category) {
		case "Café":
			return pick(cafe, seed);
		case "Pub":
			return pick(pub, seed);
		case "Fast Food":
			return pick(fast, seed);
		case "Kiosk/grill":
			return pick(kiosk, seed);
		case "Food Truck":
			return pick(truck, seed);
		case "Restaurant":
		default:
			return pick(restaurant, seed);
	}
};

const toLatLng = (el) => {
	if (typeof el.lat === "number" && typeof el.lon === "number") {
		return { lat: el.lat, lng: el.lon };
	}
	if (
		el.center &&
		typeof el.center.lat === "number" &&
		typeof el.center.lon === "number"
	) {
		return { lat: el.center.lat, lng: el.center.lon };
	}
	return null;
};

const toPlaceFromOsm = (el, city) => {
	const tags = el.tags ?? {};
	const name = tags.name;
	if (!name) return null;

	const location = toLatLng(el);
	if (!location) return null;

	const category = mapCategoryFromOsm(tags);
	const seed = hashString(`${el.type}:${el.id}:${city}`);
	const supply = mapSupplyFromCategory(category, seed);

	const streetAddress =
		tags["addr:street"] ||
		tags["addr:place"] ||
		tags["addr:district"] ||
		"";

	const addressNumber = tags["addr:housenumber"] || null;
	const neighborhood =
		tags["addr:suburb"] ||
		tags["addr:neighbourhood"] ||
		tags.suburb ||
		null;
	const zipCode = tags["addr:postcode"] || null;

	const cuisine = tags.cuisine
		? `Cuisine: ${String(tags.cuisine).replace(/;/g, ", ")}. `
		: "";
	const description =
		tags.description || `${cuisine}Imported from OpenStreetMap.`.trim();

	return {
		name,
		city,
		category,
		supply,
		description,
		streetAddress,
		...(addressNumber ? { addressNumber: String(addressNumber) } : {}),
		...(neighborhood ? { neighborhood: String(neighborhood) } : {}),
		...(zipCode ? { zipCode: String(zipCode) } : {}),
		location,
		isApproved: true,
		uid: SEED_UID,
		createdAt: Timestamp.now(),
		...(tags.website || tags["contact:website"]
			? { website: tags.website || tags["contact:website"] }
			: {}),
		...(tags.phone || tags["contact:phone"]
			? { telephone: tags.phone || tags["contact:phone"] }
			: {}),
	};
};

const buildOverpassQuery = (bbox) => {
	const { south, west, north, east } = bbox;
	return `
[out:json][timeout:25];
(
  node["amenity"~"^(restaurant|cafe|fast_food|food_court|pub|bar|biergarten)$"](${south},${west},${north},${east});
  way["amenity"~"^(restaurant|cafe|fast_food|food_court|pub|bar|biergarten)$"](${south},${west},${north},${east});
  relation["amenity"~"^(restaurant|cafe|fast_food|food_court|pub|bar|biergarten)$"](${south},${west},${north},${east});
  node["shop"="kiosk"](${south},${west},${north},${east});
  way["shop"="kiosk"](${south},${west},${north},${east});
  relation["shop"="kiosk"](${south},${west},${north},${east});
);
out center;
`;
};

const OVERPASS_ENDPOINTS = [
	"https://overpass-api.de/api/interpreter",
	"https://overpass.kumi.systems/api/interpreter",
	"https://overpass.nchc.org.tw/api/interpreter",
];

const fetchOverpass = async (query) => {
	const body = new URLSearchParams({ data: query }).toString();
	let lastErr;
	for (const url of OVERPASS_ENDPOINTS) {
		try {
			const res = await axios.post(url, body, {
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				timeout: 45_000,
			});
			return res.data;
		} catch (err) {
			lastErr = err;
		}
	}
	throw lastErr;
};

const shuffleDeterministic = (arr, seed) => {
	const next = [...arr];
	let s = seed >>> 0;
	const rand = () => {
		s = (Math.imul(1664525, s) + 1013904223) >>> 0;
		return s / 2 ** 32;
	};
	for (let i = next.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		[next[i], next[j]] = [next[j], next[i]];
	}
	return next;
};

/**
 * @typedef {"Sao Paulo" | "Malmö" | "Copenhagen"} City
 * @typedef {"Café" | "Pub" | "Restaurant" | "Fast Food" | "Kiosk/grill" | "Food Truck"} Category
 * @typedef {"General Menu" | "Lunch" | "After Work" | "Dinner" | "Breakfast/Brunch"} Supply
 */

/**
 * @param {object} input
 * @param {string} input.name
 * @param {City} input.city
 * @param {Category} input.category
 * @param {Supply} input.supply
 * @param {string} input.description
 * @param {{lat:number,lng:number}} input.location
 * @param {string} input.streetAddress
 * @param {string=} input.addressNumber
 * @param {string=} input.neighborhood
 * @param {string=} input.zipCode
 */
const makePlace = (input) => ({
	name: input.name,
	city: input.city,
	category: input.category,
	supply: input.supply,
	description: input.description,
	streetAddress: input.streetAddress,
	addressNumber: input.addressNumber,
	neighborhood: input.neighborhood,
	zipCode: input.zipCode,
	location: input.location,
	isApproved: true,
	uid: SEED_UID,
	createdAt: Timestamp.now(),
});

/** @type {Array<ReturnType<typeof makePlace>>} */
const PLACES = [
	// Sao Paulo
	makePlace({
		name: "Paulista Corner Café",
		city: "Sao Paulo",
		category: "Café",
		supply: "Breakfast/Brunch",
		description: "Coffee and light bites near the avenue.",
		streetAddress: "Avenida Paulista",
		addressNumber: "1000",
		neighborhood: "Bela Vista",
		zipCode: "01310-100",
		location: { lat: -23.5632, lng: -46.6544 },
	}),
	makePlace({
		name: "Centro Lunch Bar",
		city: "Sao Paulo",
		category: "Fast Food",
		supply: "Lunch",
		description: "Quick lunch plates and sandwiches.",
		streetAddress: "Rua Direita",
		addressNumber: "250",
		neighborhood: "Sé",
		zipCode: "01002-000",
		location: { lat: -23.5506, lng: -46.634 },
	}),
	makePlace({
		name: "Vila Madalena Taproom",
		city: "Sao Paulo",
		category: "Pub",
		supply: "After Work",
		description: "Draft beers and small plates.",
		streetAddress: "Rua Harmonia",
		addressNumber: "420",
		neighborhood: "Vila Madalena",
		zipCode: "05435-000",
		location: { lat: -23.5561, lng: -46.6946 },
	}),
	makePlace({
		name: "Ibirapuera Garden Grill",
		city: "Sao Paulo",
		category: "Kiosk/grill",
		supply: "Dinner",
		description: "Simple grilled options close to the park.",
		streetAddress: "Avenida Pedro Álvares Cabral",
		addressNumber: "1",
		neighborhood: "Ibirapuera",
		zipCode: "04094-050",
		location: { lat: -23.5874, lng: -46.658 },
	}),
	makePlace({
		name: "Pinheiros Food Truck Spot",
		city: "Sao Paulo",
		category: "Food Truck",
		supply: "General Menu",
		description: "Rotating menu with street-style favorites.",
		streetAddress: "Rua dos Pinheiros",
		addressNumber: "800",
		neighborhood: "Pinheiros",
		zipCode: "05422-001",
		location: { lat: -23.5618, lng: -46.6893 },
	}),
	makePlace({
		name: "Moema Dinner House",
		city: "Sao Paulo",
		category: "Restaurant",
		supply: "Dinner",
		description: "Casual dinner spot with a varied menu.",
		streetAddress: "Avenida Ibirapuera",
		addressNumber: "3100",
		neighborhood: "Moema",
		zipCode: "04028-013",
		location: { lat: -23.6002, lng: -46.6638 },
	}),

	// Malmö
	makePlace({
		name: "Möllan Morning Café",
		city: "Malmö",
		category: "Café",
		supply: "Breakfast/Brunch",
		description: "Fresh pastries and hot drinks.",
		streetAddress: "Södra Förstadsgatan",
		addressNumber: "90",
		neighborhood: "Möllevången",
		zipCode: "214 28",
		location: { lat: 55.5912, lng: 13.0136 },
	}),
	makePlace({
		name: "Gamla Väster Bistro",
		city: "Malmö",
		category: "Restaurant",
		supply: "Dinner",
		description: "Relaxed bistro vibes and seasonal plates.",
		streetAddress: "Västergatan",
		addressNumber: "6",
		neighborhood: "Gamla Väster",
		zipCode: "211 21",
		location: { lat: 55.6041, lng: 13.0006 },
	}),
	makePlace({
		name: "Västra Hamnen Afterwork Pub",
		city: "Malmö",
		category: "Pub",
		supply: "After Work",
		description: "Afterwork hangout by the water.",
		streetAddress: "Lilla Varvsgatan",
		addressNumber: "14",
		neighborhood: "Västra Hamnen",
		zipCode: "211 15",
		location: { lat: 55.6138, lng: 12.9766 },
	}),
	makePlace({
		name: "Triangeln Quick Bites",
		city: "Malmö",
		category: "Fast Food",
		supply: "Lunch",
		description: "Quick bites and take-away options.",
		streetAddress: "Södra Förstadsgatan",
		addressNumber: "41",
		neighborhood: "Triangeln",
		zipCode: "211 43",
		location: { lat: 55.5965, lng: 13.0016 },
	}),
	makePlace({
		name: "Kungsparken Grill Kiosk",
		city: "Malmö",
		category: "Kiosk/grill",
		supply: "General Menu",
		description: "Classic kiosk-grill menu near the park.",
		streetAddress: "Slottsgatan",
		addressNumber: "33",
		neighborhood: "Slottsstaden",
		zipCode: "211 33",
		location: { lat: 55.603, lng: 12.9915 },
	}),
	makePlace({
		name: "Malmö Street Food Truck",
		city: "Malmö",
		category: "Food Truck",
		supply: "General Menu",
		description: "Street food classics with rotating specials.",
		streetAddress: "Norra Vallgatan",
		addressNumber: "64",
		neighborhood: "Centrum",
		zipCode: "211 22",
		location: { lat: 55.607, lng: 12.9993 },
	}),

	// Copenhagen
	makePlace({
		name: "Nørrebro Coffee Corner",
		city: "Copenhagen",
		category: "Café",
		supply: "Breakfast/Brunch",
		description: "Cozy coffee spot in the neighborhood.",
		streetAddress: "Nørrebrogade",
		addressNumber: "55",
		neighborhood: "Nørrebro",
		zipCode: "2200",
		location: { lat: 55.6953, lng: 12.5508 },
	}),
	makePlace({
		name: "Vesterbro Dinner Table",
		city: "Copenhagen",
		category: "Restaurant",
		supply: "Dinner",
		description: "Casual dinner with a simple menu.",
		streetAddress: "Istedgade",
		addressNumber: "92",
		neighborhood: "Vesterbro",
		zipCode: "1650",
		location: { lat: 55.6674, lng: 12.5496 },
	}),
	makePlace({
		name: "Nyhavn Afterwork Pub",
		city: "Copenhagen",
		category: "Pub",
		supply: "After Work",
		description: "Afterwork drinks near the canal.",
		streetAddress: "Nyhavn",
		addressNumber: "18",
		neighborhood: "Indre By",
		zipCode: "1051",
		location: { lat: 55.6795, lng: 12.5903 },
	}),
	makePlace({
		name: "Østerbro Lunch Stop",
		city: "Copenhagen",
		category: "Fast Food",
		supply: "Lunch",
		description: "Fast lunch and grab-and-go.",
		streetAddress: "Østerbrogade",
		addressNumber: "120",
		neighborhood: "Østerbro",
		zipCode: "2100",
		location: { lat: 55.7062, lng: 12.5763 },
	}),
	makePlace({
		name: "Frederiksberg Grill Kiosk",
		city: "Copenhagen",
		category: "Kiosk/grill",
		supply: "General Menu",
		description: "Classic grill kiosk with comfort food.",
		streetAddress: "Falkoner Allé",
		addressNumber: "58",
		neighborhood: "Frederiksberg",
		zipCode: "2000",
		location: { lat: 55.6792, lng: 12.5346 },
	}),
	makePlace({
		name: "Copenhagen Street Food Truck",
		city: "Copenhagen",
		category: "Food Truck",
		supply: "General Menu",
		description: "Street food favorites with rotating specials.",
		streetAddress: "Refshalevej",
		addressNumber: "167",
		neighborhood: "Refshaleøen",
		zipCode: "1432",
		location: { lat: 55.6838, lng: 12.6141 },
	}),
];

const buildRealPlaces = async (totalCount) => {
	const cities = Object.keys(CITY_BBOX);
	const perCity = Math.floor(totalCount / cities.length);
	let remainder = totalCount - perCity * cities.length;

	const all = [];
	for (const city of cities) {
		const target = perCity + (remainder > 0 ? 1 : 0);
		if (remainder > 0) remainder--;

		const query = buildOverpassQuery(CITY_BBOX[city]);
		const data = await fetchOverpass(query);
		const elements = Array.isArray(data?.elements) ? data.elements : [];
		const shuffled = shuffleDeterministic(
			elements,
			hashString(`seed:${city}:${totalCount}`)
		);

		let count = 0;
		for (const el of shuffled) {
			if (count >= target) break;
			const place = toPlaceFromOsm(el, city);
			if (!place) continue;
			all.push(place);
			count++;
		}
	}

	return all;
};

const main = async () => {
	const args = process.argv.slice(2);
	if (args.includes("--help") || args.includes("-h")) {
		usage();
		process.exit(0);
	}

	const totalCountRaw = getArgValue(args, "--count") || getNpmValue("count");
	const totalCount = totalCountRaw
		? Number(totalCountRaw)
		: DEFAULT_TOTAL_COUNT;
	const useStatic = args.includes("--static") || getNpmFlag("static");
	const useReal =
		args.includes("--real") || getNpmFlag("real") || !useStatic;

	const serviceAccount = getServiceAccount(args);
	if (!serviceAccount) {
		console.error(
			"Missing credentials. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON."
		);
		usage();
		process.exit(1);
	}

	try {
		assertValidServiceAccount(serviceAccount);
	} catch (e) {
		console.error(
			"Invalid Firebase service account JSON:",
			e instanceof Error ? e.message : e
		);
		console.error(
			"Tip: Use Firebase Console > Project settings > Service accounts > Generate new private key (not gcloud user credentials)."
		);
		usage();
		process.exit(1);
	}

	const certObj = toAdminCertObject(serviceAccount);
	console.log(
		`Using service account: ${certObj.clientEmail} (project: ${certObj.projectId})`
	);

	if (!getApps().length) {
		initializeApp({
			credential: cert(certObj),
			projectId: certObj.projectId,
		});
	}

	const db = getFirestore();
	// Extra safety: if any optional fields remain undefined, ignore them.
	db.settings({ ignoreUndefinedProperties: true });
	const placesRef = db.collection("places");

	const deleteSeed = args.includes("--delete-seed") || getNpmFlag("delete_seed");
	if (deleteSeed) {
		const snap = await placesRef.where("uid", "==", SEED_UID).get();

		if (snap.empty) {
			console.log(
				"No seed documents found (uid=seed-script). Nothing to delete."
			);
			return;
		}

		const batch = db.batch();
		snap.docs.forEach((doc) => batch.delete(doc.ref));
		await batch.commit();
		console.log(`Deleted ${snap.size} seed place(s).`);
		return;
	}

	let placesToWrite = PLACES;
	if (useReal) {
		try {
			console.log(
				`Fetching ~${totalCount} real places from OpenStreetMap (Overpass)...`
			);
			const real = await buildRealPlaces(totalCount);
			if (real.length >= Math.min(20, totalCount)) {
				placesToWrite = real;
				console.log(`Fetched ${real.length} real place(s).`);
			} else {
				console.warn(
					`OSM fetch returned only ${real.length} result(s). Falling back to static demo list.`
				);
			}
		} catch (err) {
			console.warn(
				"OSM fetch failed. Falling back to static demo list.",
				err?.message ?? err
			);
		}
	}

	const batch = db.batch();
	for (const place of placesToWrite) {
		const base = `${place.city}-${place.name}`;
		const id = `seed-${slugify(place.city)}-${hashString(base).toString(
			16
		)}-${slugify(place.name).slice(0, 40)}`;
		batch.set(placesRef.doc(id), place, { merge: true });
	}

	await batch.commit();
	console.log(`Seeded ${placesToWrite.length} place(s) into 'places'.`);
};

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
