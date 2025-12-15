import React from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import FormSelect from "react-bootstrap/FormSelect";
import { BiCurrentLocation as FaLocationArrow } from "react-icons/bi";
// import PlacesAutoComplete from './PlacesAutoComplete'
import { SelectCategory, SelectSupply } from "../../../types/Place.types";

type Props = {
	handleFindLocation: () => void;
	passCategoryFilter: (filter: string) => void;
	passSupplyFilter: (filter: string) => void;
	categoryFilter: string;
	supplyFilter: string;
};

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
	passCategoryFilter,
	passSupplyFilter,
	categoryFilter,
	supplyFilter,
}) => {
	return (
		<Container
			className="rounded search-box"
			style={{
				position: "relative",
				top: "3rem",
				maxWidth: "30rem",
				background: "white",
				padding: "0.5rem",
				boxShadow: "8px 8px 5px rgba(0, 0, 0, 0.56)",
			}}
		>
			<Row className="d-flex align-items-center justify-content-center rounded">
				{/* <Col xs={12} sm={4} className='searchbox-col'>
					<PlacesAutoComplete
						placeHolderText={'Search location'}
						onClickedPlace={(results) => passOnResults(results)}
						searchPlacesOfTypes={['postal_town']}
					/>
				</Col> */}
				<Col xs={5} sm={4} className="searchbox-col">
					<FormSelect
						id="filter-categoty"
						name="select"
						onChange={(e) => passCategoryFilter(e.target.value)}
						value={categoryFilter}
						title="select"
						aria-label="Select a category"
					>
						{categoriesArr.map((category) => {
							return (
								<option key={category} value={category}>
									{category}
								</option>
							);
						})}
					</FormSelect>
				</Col>
				<Col xs={5} sm={4} className="searchbox-col">
					<FormSelect
						id="filter-supply"
						name="select"
						onChange={(e) => passSupplyFilter(e.target.value)}
						value={supplyFilter}
						title="select"
						aria-label="Select a supply"
					>
						{supplyArr.map((supply) => {
							return (
								<option key={supply} value={supply}>
									{supply}
								</option>
							);
						})}
					</FormSelect>
				</Col>
				<Col xs={2} sm={2} className="searchbox-col">
					<Button
						onClick={handleFindLocation}
						aria-label="Use my location"
						variant="dark"
						type="submit"
					>
						<FaLocationArrow style={{ fontSize: "1.5rem" }} />
					</Button>
				</Col>
			</Row>
		</Container>
	);
};

export default SearchBox;
