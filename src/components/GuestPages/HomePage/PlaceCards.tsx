import ImageGallery from "../../ImageGallery";
import UserName from "../../UserName";
import useStreamPhotosByPlace from "../../../hooks/useStreamPhotosByPlace";
import { useEffect } from "react";
import Card from "react-bootstrap/Card";
import {
	BsInstagram,
	BsGlobe,
	BsFacebook,
	BsFillTelephoneFill,
} from "react-icons/bs";
import { GoMail } from "react-icons/go";
import { Link } from "react-router-dom";
import { Place } from "../../../types/Place.types";
import DirectionIcon from "./DirectionIcon";
import { formatStreetAddress } from "../../../helpers/locations";

type Props = {
	place: Place;
};

const PlaceCards: React.FC<Props> = ({ place }) => {
	const { data: photos, getCollection } = useStreamPhotosByPlace(place._id);

	useEffect(() => {
		if (place) {
			getCollection();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [place]);

	console.log("place", place);

	return (
		<Card className="mb-3">
			<Card.Body>
				<Card.Title className="d-flex justify-content-between social-icons">
					<span>{place.name} </span>
					<span>
						{place.distanceText && (
							<small
								style={{
									fontSize: "0.9rem",
									marginRight: "0.3rem",
								}}
							>
								{place.distanceText} away
							</small>
						)}
						<DirectionIcon placeId={place._id} />
					</span>
				</Card.Title>
				<hr />
				<Card.Subtitle className="mb-2 text-muted">
					{formatStreetAddress(place.streetAddress, {
						placeName: place.name,
					})}
				</Card.Subtitle>
				<Card.Text className="roboto">{place.description}</Card.Text>

				{photos &&
					!!photos.filter((photo) => photo.isApproved).length && (
						<ImageGallery
							photos={photos.filter((photo) => photo.isApproved)}
						/>
					)}

				<Card.Text className="small text-muted">
					Recommended by: {<UserName uid={place.uid} />}
				</Card.Text>

				<Card.Footer className="card-links d-flex justify-content-between align-items-center">
					<div className="d-flex align-items-centers">
						{/* needa check here if user is authorized and conditionally render*/}
						<Link
							to={"/upload-photo/" + place._id}
							className="add-photo-links"
						>
							+ Add photo
						</Link>
					</div>
					<div className="social-icons">
						{place.website && (
							<Card.Link target="_blank" href={place.website}>
								<BsGlobe />
							</Card.Link>
						)}
						{place.email && (
							<Card.Link
								target="_blank"
								href={`mailto:${place.email}`}
							>
								<GoMail />
							</Card.Link>
						)}
						{place.instagram && (
							<Card.Link target="_blank" href={place.instagram}>
								<BsInstagram />
							</Card.Link>
						)}
						{place.facebook && (
							<Card.Link target="_blank" href={place.facebook}>
								<BsFacebook />
							</Card.Link>
						)}
						{place.telephone && (
							<Card.Link
								target="_blank"
								href={`tel:${place.telephone}`}
							>
								<BsFillTelephoneFill />
							</Card.Link>
						)}
					</div>
				</Card.Footer>
			</Card.Body>
		</Card>
	);
};

export default PlaceCards;
