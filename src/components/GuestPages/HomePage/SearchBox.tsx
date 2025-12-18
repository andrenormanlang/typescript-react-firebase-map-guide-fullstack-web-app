import React from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import FormSelect from "react-bootstrap/FormSelect";
import { BiCurrentLocation as FaLocationArrow } from "react-icons/bi";
// import PlacesAutoComplete from './PlacesAutoComplete'
import {
	SelectCategory,
	SelectCity,
	SelectSupply,
} from "../../../types/Place.types";

type Props = {
	handleFindLocation: () => void;
	passCityFilter: (city: string) => void;
	passCategoryFilter: (filter: string) => void;
	passSupplyFilter: (filter: string) => void;
	cityFilter: string;
	categoryFilter: string;
	supplyFilter: string;
};

const citiesArr: SelectCity[] = ["City", "Sao Paulo", "Malmö", "Copenhagen"];

const categoriesArr: SelectCategory[] = [
	"Category",
	"Café",
	"Pub",
	"Restaurant",
	"Fast Food",
	"Kiosk/grill",
	"Food Truck",
];
const supplyArr: SelectSupply[] = [
	"Supply",
	"General Menu",
	"Lunch",
	"After Work",
	"Dinner",
	"Breakfast/Brunch",
];

const SearchBox: React.FC<Props> = ({
	handleFindLocation,
	passCityFilter,
	passCategoryFilter,
	passSupplyFilter,
	cityFilter,
	categoryFilter,
	supplyFilter,
}) => {
	return (
		<Container fluid className="search-box-container">
			<Row className="g-2 search-box-row">
				<Col xs={12} md={3} className="search-box-col">
					<FormSelect
						id="filter-city"
						className="search-box-select"
						onChange={(e) => passCityFilter(e.target.value)}
						value={cityFilter}
						aria-label="Select a city"
					>
						{citiesArr.map((city) => (
							<option key={city} value={city}>
								{city}
							</option>
						))}
					</FormSelect>
				</Col>

				<Col xs={12} md={3} className="search-box-col">
					<FormSelect
						id="filter-category"
						className="search-box-select"
						onChange={(e) => passCategoryFilter(e.target.value)}
						value={categoryFilter}
						aria-label="Select a category"
					>
						{categoriesArr.map((category) => (
							<option key={category} value={category}>
								{category}
							</option>
						))}
					</FormSelect>
				</Col>

				<Col xs={12} md={3} className="search-box-col">
					<FormSelect
						id="filter-supply"
						className="search-box-select"
						onChange={(e) => passSupplyFilter(e.target.value)}
						value={supplyFilter}
						aria-label="Select a supply"
					>
						{supplyArr.map((supply) => (
							<option key={supply} value={supply}>
								{supply}
							</option>
						))}
					</FormSelect>
				</Col>

				<Col xs={12} md={3} className="search-box-col d-grid">
					<Button
						onClick={handleFindLocation}
						aria-label="Use my location"
						variant="dark"
						className="search-box-btn"
					>
						<FaLocationArrow
							className="me-2"
							style={{ fontSize: "1.25rem" }}
						/>
						<span className="d-md-none d-inline">
							Use My Location
						</span>
					</Button>
				</Col>
			</Row>
		</Container>
	);
};

export default SearchBox;
