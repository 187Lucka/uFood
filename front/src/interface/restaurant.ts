interface Location {
  coordinates: number[];
  type: string;
}

interface OpeningHours {
  sunday: string | null;
  monday: string | null;
  tuesday: string | null;
  wednesday: string | null;
  thursday: string | null;
  friday: string | null;
  saturday: string | null;
}

interface ApiRestaurant {
  id: string;
  name: string;
  address: string;
  genres: string[];
  location: Location;
  opening_hours: OpeningHours;
  pictures: string[];
  place_id: string;
  price_range: number;
  rating: number;
  tel: string;
}

interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone: string;
  location: {
    lat: number;
    lng: number;
  };
  directions: string;
  hours: string;
  photos: string[];
  genres: string[];
  priceRange: string;
  rating: number;
  priceRangeNumber: number;
}

export type { Restaurant, Location, OpeningHours, ApiRestaurant };