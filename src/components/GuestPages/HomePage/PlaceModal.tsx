import ImageGallery from "../../ImageGallery";
import UserName from "../../UserName";
import useAuth from "../../../hooks/useAuth";
import useStreamPhotosByPlace from "../../../hooks/useStreamPhotosByPlace";
import { useEffect } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Modal from "react-bootstrap/Modal";
import Image from "react-bootstrap/Image";
import Row from "react-bootstrap/Row";
import { BiEditAlt } from "react-icons/bi";
import {
	BsInstagram,
	BsGlobe,
	BsFacebook,
	BsFillTelephoneFill,
} from "react-icons/bs";
import { GoMail } from "react-icons/go";
import { Link, useNavigate } from "react-router-dom";
import { Place } from "../../../types/Place.types";
import { getIconForCategory } from "../../../helpers/icons";
import DirectionIcon from "./DirectionIcon";

import { formatStreetAddress } from "../../../helpers/locations";
interface IProps {
	onClose: () => void;
	place: Place;
	show: boolean;
}

const PlaceModal: React.FC<IProps> = ({ onClose, place, show }) => {
	const navigate = useNavigate();
	const iconSize = 20;
	const { data: photos, getCollection } = useStreamPhotosByPlace(place._id);

	const { signedInUserDoc } = useAuth();

	useEffect(() => {
		if (place) {
			getCollection();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [place]);

	return (
		<Modal centered onHide={onClose} show={show}>
			<Modal.Header closeButton>
				<Modal.Title>
					<Image
						src={getIconForCategory(place.category) ?? ""}
						style={{
							width: "2rem",
						}}
					/>{" "}
					{place.name}
					{signedInUserDoc && signedInUserDoc.isAdmin && (
						<Button
							className="ms-2"
							onClick={() =>
								navigate("/admin-edit-place/" + place._id)
							}
							size="sm"
							variant="warning"
						>
							<BiEditAlt />
						</Button>
					)}
				</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<div className="d-flex justify-content-between social-icons">
					<span>
						{place.supply} | {place.category}
					</span>
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
				</div>
				<div className="small text-muted my-1">
					{formatStreetAddress(place.streetAddress, {
						placeName: place.name,
					})}
				</div>

				{photos &&
					!!photos.filter((photo) => photo.isApproved).length && (
						<ImageGallery
							photos={photos.filter((photo) => photo.isApproved)}
						/>
					)}

				<div className="small text-muted mt-2">
					Recommended by: {<UserName uid={place.uid} />}
				</div>
			</Modal.Body>
			<Modal.Footer className="position-relative">
				<Row
					className="position-absolute start-0 g-3 pb-3 social-icons"
					xs="auto"
				>
					{place.website && (
						<Col>
							<Link to={place.website} target="_blank">
								<BsGlobe size={iconSize} />
							</Link>
						</Col>
					)}

					{place.facebook && (
						<Col>
							<Link to={place.facebook} target="_blank">
								<BsFacebook size={iconSize} />
							</Link>
						</Col>
					)}

					{place.instagram && (
						<Col>
							<Link to={place.instagram} target="_blank">
								<BsInstagram size={iconSize} />
							</Link>
						</Col>
					)}

					{place.telephone && (
						<Col>
							<Link to={`tel:${place.telephone}`} target="_blank">
								<BsFillTelephoneFill size={iconSize} />
							</Link>
						</Col>
					)}

					{place.email && (
						<Col>
							<Link to={`mailto:${place.email}`}>
								<GoMail size={iconSize} />
							</Link>
						</Col>
					)}
				</Row>

				<Button
					onClick={() => navigate("/upload-photo/" + place._id)}
					size="sm"
					variant="primary"
				>
					Add Photo
				</Button>

				<Button onClick={onClose} size="sm" variant="secondary">
					Close
				</Button>
			</Modal.Footer>
		</Modal>
	);
};

export default PlaceModal;
