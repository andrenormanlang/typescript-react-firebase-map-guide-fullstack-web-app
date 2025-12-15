# Hangry Food Guide App made by Group 3

![](https://utbweb.its.ltu.se/~anolan-1/medieinstitutet/screenshots-readmes-github/hanger-mgmt-1.png)

![](https://utbweb.its.ltu.se/~anolan-1/medieinstitutet/screenshots-readmes-github/hanger-mgmt-2.png)

![](https://utbweb.its.ltu.se/~anolan-1/medieinstitutet/screenshots-readmes-github/hanger-mgmt-3.png)

An app that acts as a food guide for those moments when you're "hangry" but don't know where to eat or just need some coffee/tea.

## Technical Requirements

- All data is fetched, created, and updated using Firebase.
- OpenStreetMap (via Leaflet) displays food places from the Firebase Firestore database.
- Responsive design.
- Component-based architecture.
- Uses React Router for navigation.
- Utilizes Firebase Firestore, Authentication, and Storage.
- Implements React Table for tabular data.
- Utilizes React Hook Form for form handling.
- Integrates OpenStreetMap + Nominatim (geocoding) for location-based features.
- Adheres to the principle of separating API communication into intermediate layers.
- Uses Bootstrap and SCSS for UI styling.

### Users Can

- View nearby restaurants on a map and in a list.
- Access detailed information about a restaurant, including address, location, description, category, range, contact details, and online presence.
- Filter restaurants by category and range.
- Search for restaurants based on their location.
- Enter a city to display restaurants (useful when GPS is not available).
- Sort the restaurant list by name.
- See their own position on the map.
- Search for restaurants by typing in a location (with autocomplete).
- Recommend new places to eat.

### Prerequisites

- Node.js and npm installed locally.
- Firebase project configured with Firestore, Authentication, and Storage.

### Administrators Can

- Perform CRUD (Create, Read, Update, Delete) operations on restaurants.
- Manage user-submitted tips.
- View a table of all administrators and users, including profile pictures (if available).
- Update their own profiles, including name, profile image URL, email, and password.

Please note: Searches for restaurants are restricted to selected locations.
