import PlacesAutoComplete from "../../components/GuestPages/HomePage/PlacesAutoComplete";
import { FirebaseError } from "firebase/app";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import useAuth from "../../hooks/useAuth";
import { useState } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { placesCol } from "../../services/firebase";
import { formatStreetAddress } from "../../helpers/locations";
import { Category, Place, Supply } from "../../types/Place.types";
import type { LatLngLiteral } from "../../types/Geo.types";
import {
	getLatLngFromNominatim,
	type NominatimSearchResult,
} from "../../services/nominatim";

const categories: Category[] = [
	"Café",
	"Pub",
	"Restaurant",
	"Fast Food",
	"Kiosk/grill",
	"Food Truck",
];

const supplyOptions: Supply[] = [
	"General Menu",
	"Lunch",
	"After Work",
	"Dinner",
	"Breakfast/Brunch",
];

const PlaceFormPage = () => {
	const [selectedPlace, setSelectedPlace] = useState<LatLngLiteral | null>(
		null
	);
	const [isError, setIsError] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [placeName, setPlaceName] = useState<string | undefined>(undefined);
	const {
		handleSubmit,
		register,
		setValue,
		formState: { errors },
	} = useForm<Place>();

	const { signedInUser, signedInUserDoc } = useAuth();

	const onSubmit = async (data: Place) => {
		try {
			setIsError(false);
			setErrorMessage(null);
			setIsSubmitting(true);

			if (!selectedPlace) {
				setIsError(true);
				setErrorMessage("Please select a location");
				setIsSubmitting(false);
				return;
			}

			if (!signedInUser) {
				setIsError(true);
				setErrorMessage("User not authenticated");
				setIsSubmitting(false);
				return;
			}

			if (!data._id) {
				setIsError(true);
				setErrorMessage("Please select a valid place");
				setIsSubmitting(false);
				return;
			}

			const docRef = doc(placesCol, data._id);

			const newPlace = {
				...data,
				createdAt: serverTimestamp(),
				// Always create as a suggestion to match common Firestore rules
				isApproved: false,
				uid: signedInUser.uid,
			};

			await setDoc(docRef, newPlace);

			toast.dark("Place added successfully!");

			setValue("name", "");
			setValue("description", "");
			setValue("email", "");
			setValue("telephone", "");
			setValue("website", "");
			setValue("facebook", "");
			setValue("instagram", "");

			setIsSubmitting(false);
		} catch (error) {
			if (error instanceof FirebaseError) {
				if (error.code === "permission-denied") {
					setErrorMessage(
						"Missing or insufficient permissions. Your Firestore security rules are blocking writes to the 'places' collection for this user."
					);
				} else {
					setErrorMessage(error.message);
				}
			} else {
				setErrorMessage("An error occurred while adding the place");
			}
			setIsError(true);
			setIsSubmitting(false);
		}
	};

	return (
		<Container className="py-3 center-y">
			<Row>
				<Col md={{ span: 6, offset: 3 }}>
					<Card>
						<Card.Body>
							<Card.Title className="mb-3">
								{signedInUserDoc && signedInUserDoc.isAdmin
									? "Add"
									: "Recommend"}{" "}
								Place
							</Card.Title>

							{isError && (
								<Alert variant="danger">{errorMessage}</Alert>
							)}

							<div className="mb-3">
								{placeName && (
									<h2 className="h6 mb-3">
										Name: {placeName}
									</h2>
								)}
								<PlacesAutoComplete
									placeHolderText="Search place*"
									showInitialPlace={true}
									onClickedPlace={(
										result: NominatimSearchResult,
										name
									) => {
										if (!result) {
											setIsError(true);
											setErrorMessage(
												"Please select a valid place"
											);
											return;
										}

										setIsError(false);
										setErrorMessage(null);

										setValue(
											"_id",
											String(result.place_id)
										);
										setValue("name", name);
										setPlaceName(name);

										const selectedAddress =
											formatStreetAddress(
												result.display_name || "",
												{ placeName: name }
											);
										setValue(
											"streetAddress",
											selectedAddress
										);

										const { lat, lng } =
											getLatLngFromNominatim(result);
										setSelectedPlace({ lat, lng });
										setValue("location", { lat, lng });
									}}
								/>
							</div>

							<Form onSubmit={handleSubmit(onSubmit)}>
								<Form.Group
									className="mb-3"
									controlId="description"
								>
									<Form.Control
										as="textarea"
										placeholder="Description*"
										rows={3}
										{...register("description", {
											required: "Description missing",
											minLength: {
												value: 10,
												message:
													"Enter at least 10 characters",
											},
											maxLength: {
												value: 300,
												message:
													"Maximum character limit exceeded (300 characters)",
											},
										})}
										className="roboto"
									/>
									{errors.description && (
										<Form.Text className="invalid-value">
											{errors.description.message}
										</Form.Text>
									)}
									<Form.Text>
										Min: 10 characters, Max: 300 characters
									</Form.Text>
								</Form.Group>

								<Form.Group
									className="mb-3"
									controlId="category"
								>
									<Form.Select
										aria-label="Select category of the place"
										className="form-select"
										id="category"
										{...register("category", {
											required: "Category missing",
										})}
									>
										<option value="" defaultChecked>
											Select Category*
										</option>
										{categories.map((category) => (
											<option
												key={category}
												value={category}
											>
												{category}
											</option>
										))}
									</Form.Select>
									{errors.category && (
										<Form.Text className="invalid-value">
											{errors.category.message}
										</Form.Text>
									)}
								</Form.Group>

								<Form.Group className="mb-3" controlId="supply">
									<Form.Select
										aria-label="Select supply of the place"
										className="form-select"
										id="supply"
										{...register("supply", {
											required: "Supply missing",
										})}
									>
										<option value="" defaultChecked>
											Select Supply*
										</option>
										{supplyOptions.map((supply) => (
											<option key={supply} value={supply}>
												{supply}
											</option>
										))}
									</Form.Select>
									{errors.supply && (
										<Form.Text className="invalid-value">
											{errors.supply.message}
										</Form.Text>
									)}
								</Form.Group>

								<Form.Group className="mb-3" controlId="email">
									<Form.Control
										placeholder="Email"
										type="email"
										{...register("email")}
									/>
									{errors.email && (
										<Form.Text className="invalid-value">
											{errors.email.message}
										</Form.Text>
									)}
								</Form.Group>

								<Form.Group
									className="mb-3"
									controlId="telephone"
								>
									<Form.Control
										placeholder="Telephone"
										type="tel"
										{...register("telephone")}
									/>
								</Form.Group>

								<Form.Group
									className="mb-3"
									controlId="website"
								>
									<Form.Control
										placeholder="Website"
										type="url"
										{...register("website")}
									/>
								</Form.Group>

								<Form.Group
									className="mb-3"
									controlId="facebook"
								>
									<Form.Control
										placeholder="Facebook"
										type="url"
										{...register("facebook")}
									/>
								</Form.Group>

								<Form.Group
									className="mb-3"
									controlId="instagram"
								>
									<Form.Control
										placeholder="Instagram"
										type="url"
										{...register("instagram")}
									/>
								</Form.Group>

								<Button
									disabled={isSubmitting}
									size="sm"
									type="submit"
									variant="primary"
								>
									{isSubmitting
										? "Submitting Place..."
										: "Submit Place"}
								</Button>
							</Form>
						</Card.Body>
					</Card>
				</Col>
			</Row>
		</Container>
	);
};

export default PlaceFormPage;
