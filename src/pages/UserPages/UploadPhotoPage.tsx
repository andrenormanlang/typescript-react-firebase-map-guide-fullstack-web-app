import ImageGallery from "../../components/ImageGallery";
import { FirebaseError } from "firebase/app";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import useAuth from "../../hooks/useAuth";
import useGetPlace from "../../hooks/useGetPlace";
import useStreamPhotosByPlace from "../../hooks/useStreamPhotosByPlace";
import { useRef, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import ProgressBar from "react-bootstrap/ProgressBar";
import Row from "react-bootstrap/Row";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import { photosCol, storage } from "../../services/firebase";
import { PhotoUpload } from "../../types/Photo.types";
import { v4 } from "uuid";

const UploadPhotoPage = () => {
	const [isError, setIsError] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [uploadProgress, setUploadProgress] = useState<number | null>(null);

	const {
		handleSubmit,
		register,
		resetField,
		watch,
		formState: { errors },
	} = useForm<PhotoUpload>();

	const { placeId } = useParams();
	const place = useGetPlace(placeId);
	const navigate = useNavigate();

	const { data: photos } = useStreamPhotosByPlace(placeId);

	const photoRef = useRef<FileList | null>(null);
	photoRef.current = watch("photoFile");

	const { signedInUser, signedInUserDoc } = useAuth();

	const onSubmit = async (data: PhotoUpload) => {
		try {
			setIsError(false);
			setErrorMessage(null);
			setIsSubmitting(true);

			if (!signedInUser) {
				setIsError(true);
				setErrorMessage("User not authenticated");
				setIsSubmitting(false);
				return;
			}

			if (!placeId) {
				setIsError(true);
				setErrorMessage("No place connected");
				setIsSubmitting(false);
				return;
			}

			if (!data.photoFile.length) {
				setIsError(true);
				setErrorMessage("Photo missing");
				setIsSubmitting(false);
				return;
			}

			if (data.photoFile.length) {
				const photo = data.photoFile[0];
				const _id = v4();
				const ext = photo.name.substring(
					photo.name.lastIndexOf(".") + 1
				);
				const storageFileName = _id + "." + ext;
				const fileRef = ref(
					storage,
					`places/${placeId}/${storageFileName}`
				);

				const uploadTask = uploadBytesResumable(fileRef, photo);

				uploadTask.on(
					"state_changed",
					(snapshot) => {
						setUploadProgress(
							Math.round(
								(snapshot.bytesTransferred /
									snapshot.totalBytes) *
									1000
							) / 10
						);
					},
					(error) => {
						setIsError(true);
						setErrorMessage(error.message);
						setUploadProgress(null);
						setIsSubmitting(false);
					},
					async () => {
						try {
							const url = await getDownloadURL(fileRef);

							const docRef = doc(photosCol, _id);
							await setDoc(docRef, {
								_id,
								createdAt: serverTimestamp(),
								ext,
								isApproved:
									(signedInUserDoc &&
										signedInUserDoc.isAdmin) ||
									false,
								name: photo.name,
								placeId,
								placeName: place.data?.name,
								uid: signedInUser.uid,
								url,
							});

							if (photoRef.current) photoRef.current = null;

							toast.dark(
								signedInUserDoc && signedInUserDoc.isAdmin
									? "Photo added"
									: "Photo under review"
							);
							navigate("/");
						} catch (error) {
							if (error instanceof FirebaseError) {
								setErrorMessage(error.message);
							} else {
								setErrorMessage(
									"An error occurred while finalizing the upload"
								);
							}
							setIsError(true);
						} finally {
							setUploadProgress(null);
							resetField("photoFile");
							setIsSubmitting(false);
						}
					}
				);
			}

			return;
		} catch (error) {
			if (error instanceof FirebaseError) {
				setErrorMessage(error.message);
			} else {
				setErrorMessage("An error occurred while adding a photo");
			}
			setIsError(true);
			setUploadProgress(null);
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
								Add photo to {place.data?.name}
							</Card.Title>

							{isError && (
								<Alert variant="danger">{errorMessage}</Alert>
							)}

							<Form onSubmit={handleSubmit(onSubmit)}>
								<Form.Group controlId="photo" className="mb-3">
									<Form.Control
										accept="image/jpeg, image/png, image/webp, image/gif"
										type="file"
										{...register("photoFile", {
											required: "Photo missing",
										})}
									/>
									{errors.photoFile && (
										<p className="invalid-value">
											{errors.photoFile.message ??
												"Invalid value"}
										</p>
									)}
									<Form.Text>
										{uploadProgress !== null ? (
											<ProgressBar
												now={uploadProgress}
												label={`${uploadProgress}%`}
												animated
												className="mt-1"
												variant="primary"
											/>
										) : (
											photoRef.current &&
											photoRef.current.length > 0 && (
												<span>
													{photoRef.current[0].name} (
													{Math.round(
														photoRef.current[0]
															.size / 1024
													)}{" "}
													kB)
												</span>
											)
										)}
									</Form.Text>
								</Form.Group>

								<Button
									disabled={isSubmitting}
									size="sm"
									type="submit"
									variant="primary"
								>
									{isSubmitting
										? "Adding Photo..."
										: "Add Photo"}
								</Button>
							</Form>
						</Card.Body>
					</Card>
					{photos &&
						!!photos.filter((photo) => photo.isApproved).length && (
							<ImageGallery
								photos={photos
									.filter((photo) => photo.isApproved)
									.filter((photo) => photo.isApproved)}
							/>
						)}
				</Col>
			</Row>
		</Container>
	);
};

export default UploadPhotoPage;
