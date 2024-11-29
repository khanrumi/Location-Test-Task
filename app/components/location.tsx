'use client'
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Interfaces for the data structure
interface Neighborhood {
  id: number;
  name: string;
  cityId: number;
  createdAt: string;
  updatedAt: string;
}

interface City {
  id: number;
  name: string;
  stateId: number;
  createdAt: string;
  updatedAt: string;
}

interface State {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// Define a new interface for the location suggestion
interface LocationSuggestion {
  id: string; // Use a unique identifier, such as place_id
  name: string; // Use the formatted address or another suitable field
}

// Add this new interface
interface LocationData {
  state: string;
  city: string;
  neighborhoods: string[];
}

const AddressForm = () => {
  const [states, setStates] = useState<State[]>([]);
  const [selectedState, setSelectedState] = useState<number | ''>('');
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<number | ''>('');
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<number | ''>('');
  const [searchLocation, setSearchLocation] = useState<string>('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [allCities, setAllCities] = useState<City[]>([]);
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/address');
        console.log('Initial Data:', {
          states: response.data.states.length,
          cities: response.data.cities.length,
          neighborhoods: response.data.neighborhoods.length
        });
        setStates(response.data.states);
        setAllCities(response.data.cities);
        setCities(response.data.cities);
        setNeighborhoods(response.data.neighborhoods);
      } catch (error) {
        console.error('Error fetching location data:', error);
      }
    };
    fetchData();
  }, []);

  // Update cities when a state is selected
  useEffect(() => {
    if (selectedState) {
      console.log('Filtering cities for state:', selectedState);
      console.log('All cities before filter:', allCities.length);
      const filteredCities = allCities.filter(city => {
        const matches = city.stateId === Number(selectedState);
        console.log(`City ${city.name} (stateId: ${city.stateId}) matches selected state ${selectedState}: ${matches}`);
        return matches;
      });
      console.log('Filtered cities:', filteredCities.length);
      setCities(filteredCities);
      setSelectedCity('');
      setSelectedNeighborhood('');
    } else {
      console.log('No state selected, showing all cities:', allCities.length);
      setCities(allCities);
    }
  }, [selectedState, allCities]);

  // Update neighborhoods when a city is selected
  useEffect(() => {
    if (selectedCity) {
      const filteredNeighborhoods = neighborhoods.filter(
        neighborhood => neighborhood.cityId === Number(selectedCity)
      );
      setNeighborhoods(filteredNeighborhoods);
      setSelectedNeighborhood('');
    }
  }, [selectedCity, neighborhoods]);

  // Update the handleLocationSearchChange function
  const handleLocationSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchLocation(query);

    if (query.length > 3) {
      axios
        .get('http://localhost:3000/api/location', {
          params: { query },
        })
        .then((response) => {
          if (response.data && response.data.locData) {
            setLocationData(response.data.locData);
            setLocationSuggestions([]);
          } else {
            console.log('No valid location data in response:', response.data);
            setLocationSuggestions([]);
            setLocationData(null);
          }
        })
        .catch((error) => {
          console.error('Error details:', {
            message: error.message,
            response: error.response,
            status: error.response?.status
          });
          setLocationSuggestions([]);
          setLocationData(null);
        });
    } else {
      setLocationSuggestions([]);
      setLocationData(null);
    }
  };

  console.log('Render state:', {
    selectedState,
    citiesLength: cities.length,
    allCitiesLength: allCities.length,
    cities: cities
  });

  return (
    <div className="address-form">
      <div className="address-form__field">
        <label htmlFor="state">State</label>
        <select
          id="state"
          value={selectedState}
          onChange={(e) => {
            const stateId = Number(e.target.value) || '';
            console.log('State selected:', stateId);
            setSelectedState(stateId);
          }}
        >
          <option value="">Select a State</option>
          {states.map((state) => (
            <option key={state.id} value={state.id}>
              {state.name}
            </option>
          ))}
        </select>
      </div>
      <div className="address-form__field">
        <label htmlFor="city">City</label>
        <select
          id="city"
          value={selectedCity}
          onChange={(e) => setSelectedCity(Number(e.target.value) || '')}
          disabled={!selectedState}
        >
          <option value="">Select a City</option>
          {cities && cities.length > 0 ? (
            cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name} ({city.stateId})
              </option>
            ))
          ) : (
            <option value="" disabled>No cities available</option>
          )}
        </select>
      </div>
      <div className="address-form__field">
        <label htmlFor="neighborhood">Neighborhood</label>
        <select
          id="neighborhood"
          value={selectedNeighborhood}
          onChange={(e) => setSelectedNeighborhood(Number(e.target.value) || '')}
          disabled={!selectedCity}
        >
          <option value="">Select a Neighborhood</option>
          {neighborhoods.map((neighborhood) => (
            <option key={neighborhood.id} value={neighborhood.id}>
              {neighborhood.name}
            </option>
          ))}
        </select>
      </div>
      <div className="address-form__field">
        <label htmlFor="location-search">Location Search</label>
        <input
          id="location-search"
          type="text"
          value={searchLocation}
          onChange={handleLocationSearchChange}
          ref={inputRef}
        />
        {locationSuggestions.length > 0 && (
          <ul className="suggestions-list">
            {locationSuggestions.map((suggestion) => (
              <li 
                key={suggestion.id}
                className="suggestion-item"
                onClick={() => {
                  setSearchLocation(suggestion.name);
                  setLocationSuggestions([]);
                }}
              >
                {suggestion.name}
              </li>
            ))}
          </ul>
        )}
        
        {/* Add this new section */}
        {locationData && (
          <div className="location-details">
            <h3>Location Details</h3>
            <div className="location-info">
              <p><strong>State:</strong> {locationData.state}</p>
              <p><strong>City:</strong> {locationData.city}</p>
              {locationData.neighborhoods.length > 0 && (
                <div>
                  <p><strong>Neighboring Cities:</strong></p>
                  <ul className="neighbors-list">
                    {locationData.neighborhoods.map((neighbor, index) => (
                      <li key={index}>{neighbor}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Add these styles to your CSS
const styles = `
.location-details {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  background-color: #f8fafc;
}

.location-info {
  margin-top: 0.5rem;
}

.location-info p {
  margin: 0.25rem 0;
}

.neighbors-list {
  list-style-type: none;
  padding-left: 1rem;
  margin-top: 0.25rem;
}

.neighbors-list li {
  margin: 0.25rem 0;
  color: #4a5568;
}
`;

export default AddressForm;
