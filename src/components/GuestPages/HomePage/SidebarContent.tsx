import React, { useState } from 'react'
import { Place } from '../../../types/Place.types'
import NoPlacesToShow from './NoPlacesToShow'
import SortAndMapPlaces from './SortAndMapPlaces'
import TextSearch from './TextSearch'

type Props = {
	places: Place[]
}

const SidebarContent: React.FC<Props> = ({ places }) => {
	const [searchQuery, setSearchQuery] = useState('');

	const filteredPlaces = places.filter(place =>
		place.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

	return (
		<>
			<TextSearch onSearch={setSearchQuery} />
			<NoPlacesToShow
				places={filteredPlaces}
			/>
			<SortAndMapPlaces
				places={filteredPlaces} 
			/>
		</>
	)
}

export default SidebarContent
