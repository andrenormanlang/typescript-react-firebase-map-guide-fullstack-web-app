import AdminPlacesSortableTable from "../../components/AdminPages/AdminPlacesSortableTable";
import useStreamPlaces from "../../hooks/useStreamPlaces";
import Alert from "react-bootstrap/Alert";
import { ColumnDef } from "@tanstack/react-table";
import { Place } from "../../types/Place.types";
import { formatPlaceAddress } from "../../helpers/locations";

const columns: ColumnDef<Place>[] = [
	{
		accessorKey: "name",
		header: "Name",
	},
	{
		accessorKey: "streetAddress",
		header: "Address",
		cell: (info) =>
			formatPlaceAddress(info.row.original, {
				placeName: info.row.original.name,
			}),
	},
	{
		accessorKey: "category",
		header: "Category",
	},
	{
		accessorKey: "uid",
		header: "User",
	},
	{
		accessorKey: "createdAt",
		header: "Created",
	},
	{
		accessorKey: "isApproved",
		header: "Approved",
	},
	{
		accessorKey: "_id",
		header: "Edit",
	},
];

const AdminPlacesListPage = () => {
	const { data, error, isError, isLoading } = useStreamPlaces();

	if (isLoading) return <div>Loading places...</div>;

	if (isError) return <Alert variant="danger">{error}</Alert>;

	if (data)
		return (
			<>
				<h3 className="mb-3 title-table">Places</h3>
				<AdminPlacesSortableTable columns={columns} data={data} />
			</>
		);
	return null;
};

export default AdminPlacesListPage;
