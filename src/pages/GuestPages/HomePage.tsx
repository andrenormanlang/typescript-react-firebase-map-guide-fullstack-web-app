import Map from "../../components/GuestPages/HomePage/Map";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Offcanvas from "react-bootstrap/Offcanvas";
import { useState } from "react";
import { Place } from "../../types/Place.types";
import { MdMenuOpen } from "react-icons/md";
import SidebarContent from "../../components/GuestPages/HomePage/SidebarContent";
import Form from "react-bootstrap/Form";
import Card from "react-bootstrap/Card";
import { useSearchParams } from "react-router-dom";

const CITIES = ["Sao Paulo", "Malmö", "Copenhagen"] as const;

const HomePage = () => {
	const [places, setPlaces] = useState<Place[] | null>(null);
	const [show, setShow] = useState(false);
	const [searchParams, setSearchParams] = useSearchParams();
	const localityParam = searchParams.get("locality");
	const [cityChoice, setCityChoice] = useState<string>(localityParam ?? "");
	const needsCitySelection = !localityParam;

	const handleConfirmCity = () => {
		const next = cityChoice.trim();
		if (!next) return;
		setSearchParams({ locality: next }, { replace: true });
	};

	if (needsCitySelection) {
		return (
			<Container fluid className="py-3 center-y">
				<Row className="d-flex justify-content-center">
					<Col lg={{ span: 6 }}>
						<Card>
							<Card.Body>
								<Card.Title className="mb-3">
									Choose a city
								</Card.Title>
								<Form.Group
									className="mb-3"
									controlId="initial-city"
								>
									<Form.Select
										value={cityChoice}
										onChange={(e) =>
											setCityChoice(e.target.value)
										}
									>
										<option value="">Select City*</option>
										{CITIES.map((c) => (
											<option key={c} value={c}>
												{c}
											</option>
										))}
									</Form.Select>
								</Form.Group>

								<Button
									variant="primary"
									disabled={!cityChoice}
									onClick={handleConfirmCity}
								>
									Continue
								</Button>
							</Card.Body>
						</Card>
					</Col>
				</Row>
			</Container>
		);
	}

	return (
		<>
			{/* Offcanvas and button to launch it showing in all below large screens */}
			<Offcanvas
				className="d-block d-lg-none offcanvas"
				show={show}
				onHide={() => setShow(false)}
			>
				<Offcanvas.Header closeButton>
					<Offcanvas.Title>
						<span className="h2">Places</span>
					</Offcanvas.Title>
				</Offcanvas.Header>
				<Offcanvas.Body>
					{places && <SidebarContent places={places} />}
				</Offcanvas.Body>
			</Offcanvas>
			<Button
				className="d-lg-none offcanvas-btn"
				variant="secondary"
				onClick={() => setShow(true)}
			>
				<MdMenuOpen />
			</Button>

			{/* Sidebar showing in all above large screens */}
			<Container fluid className="py-3 center-y">
				<Row className="d-flex justify-content-center">
					<Col
						className="d-none d-lg-block places-sidebar"
						lg={{ span: 3 }}
					>
						<h2>Places</h2>
						{places && <SidebarContent places={places} />}
					</Col>
					<Col lg={{ span: 9 }}>
						<Map
							placesFound={(placesFound) =>
								setPlaces(placesFound)
							}
						/>
					</Col>
				</Row>
			</Container>
		</>
	);
};

export default HomePage;
