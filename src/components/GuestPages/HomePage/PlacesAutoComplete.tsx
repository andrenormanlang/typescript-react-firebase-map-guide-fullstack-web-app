import React, { useEffect, useState } from 'react';
import { Form, ListGroup, ListGroupItem } from 'react-bootstrap';
import useOnclickOutside from 'react-cool-onclickoutside';
import { useSearchParams } from 'react-router-dom';
import usePlacesAutoComplete, { getGeocode } from 'use-places-autocomplete';

type Props = {
    onClickedPlace: (results: google.maps.GeocoderResult[], placeName: string) => void;
    searchPlacesOfTypes?: string[] | undefined;
    placeHolderText: string;
    showInitialPlace?: boolean;
};

const PlacesAutoComplete: React.FC<Props> = ({ onClickedPlace, searchPlacesOfTypes, placeHolderText, showInitialPlace }) => {
    const [showUl, setShowUl] = useState<boolean>(false);
    const [searchParams] = useSearchParams();
    const locality = searchParams.get("locality") ?? "São Paulo";

    // Define the bounds for São Paulo
    const saoPauloBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(-23.356603, -46.825514), // Southwest corner
        new google.maps.LatLng(-24.008814, -46.365052)  // Northeast corner
    );

    // Initialize the usePlacesAutoComplete hook with updated requestOptions
    const {
        ready,
        value,
        setValue,
        suggestions: { status, data },
        clearSuggestions,
    } = usePlacesAutoComplete({
        requestOptions: {
            bounds: saoPauloBounds,
            componentRestrictions: { country: 'BR' },
            // types: searchPlacesOfTypes ?? ['address']
            types: searchPlacesOfTypes ?? ['establishment']
        },
    });

    const ref = useOnclickOutside(() => {
        clearSuggestions();
        setShowUl(false);
        if (!showInitialPlace) {
            setValue(locality + ', Brasil');
        }
    });

    const handleInputClick = () => {
        setValue('');
        setShowUl(true);
    };

	const filteredSuggestions = data.filter(
        (suggestion) => suggestion.description.includes('São Paulo')
    );


    const handleSelect = ({ description, structured_formatting }: google.maps.places.AutocompletePrediction) => (
        async () => {
            setValue(description, false);
            clearSuggestions();

            const results = await getGeocode({
				address: `${description}, São Paulo`,
				componentRestrictions: { country: 'BR' }
			});
            const placeName = structured_formatting.main_text;
            onClickedPlace(results, placeName);
        }
    );



    useEffect(() => {
        setShowUl(false);
        if (!showInitialPlace) {
            setValue(locality + ', Brasil');
        }
    }, [setValue, locality, showInitialPlace]);

    return (
        <div ref={ref}>
            <Form.Control
                role='combobox'
                onClick={handleInputClick}
                value={value}
                onChange={e => setValue(e.target.value)}
                disabled={!ready}
                placeholder={placeHolderText}
            />
            {status === 'OK' && showUl &&
                <ListGroup
                    style={{
                        position: 'absolute',
                    }}
                >
                    {filteredSuggestions.map((suggestion) => {
                        const {
                            place_id,
                            structured_formatting: { main_text, secondary_text }
                        } = suggestion;

                        return (
                            <ListGroupItem
                                key={place_id}
                                onClick={handleSelect(suggestion)}>
                                <strong>{main_text}</strong> <small>{secondary_text}</small>
                            </ListGroupItem>
                        );
                    })}
                </ListGroup>
            }
        </div>
    );
};

export default PlacesAutoComplete;

