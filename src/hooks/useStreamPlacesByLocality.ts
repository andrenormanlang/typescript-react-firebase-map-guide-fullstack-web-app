import { where } from 'firebase/firestore'
import useStreamCollection from './useStreamCollection'
import { placesCol } from '../services/firebase'
import { Place } from '../types/Place.types'

// const useStreamPlacesByLocality = (locality: string, category: string, supply: string) => {
const useStreamPlacesByLocality = ( category: string, supply: string) => {
	return useStreamCollection<Place>(
		placesCol,
		where("isApproved", "==", true),
		// where("city", "==", locality),
		where(
			"category",
			"in",
			category === "Category"
				? [
					"Café",
					"Pub",
					"Restaurant",
					"Fast Food",
					"Kiosk/grill",
					"Food Truck",
				]
				: [category]
		),
		where(
			"supply",
			"in",
			supply === "Supply"
				? [
					'General Menu',
					'Lunch',
					'After Work',
					'Dinner',
					'Breakfast/Brunch'
				]
				: [supply]
		),
	)
}

export default useStreamPlacesByLocality
