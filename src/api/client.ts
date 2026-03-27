export type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  photo?: string | null;
  bio?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  radius: number;
  carbonSavedKg: number;
  rating: number; // overall rating
  vehicleModel?: string | null;
  vehicleColor?: string | null;
  vehiclePlate?: string | null;
  language: string;
  pushToken?: string | null;
  createdAt: string;
};

export type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
};

export type Ride = {
  id: string;
  driverId: string;
  driver?: User;
  startLocation: string;
  startLat?: number | null;
  startLng?: number | null;
  endLocation: string;
  endLat?: number | null;
  endLng?: number | null;
  departureDatetime: string;
  availableSeats: number;
  status: string;
  description?: string;
  requirePhoto?: boolean;
  minRating?: number | null;
  distanceKm?: number;
  bookings: Booking[];
};

export type Booking = {
  id: string;
  userId: string;
  user?: User;
  rideId: string;
  seatsBooked: number;
  status: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  ride: Ride;
  isRated: boolean;
};

export type Review = {
  id: string;
  reviewerId: string;
  reviewer: User;
  targetId: string;
  target: User;
  bookingId: string;
  rating: number;
  comment?: string;
  role: "DRIVER" | "PASSENGER";
  createdAt: string;
};

export type Complaint = {
  id: string;
  reporterId: string;
  targetId: string;
  bookingId: string;
  reason: string;
  status: "PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED";
  createdAt: string;
};

export interface CreateRideInput {
  startLocation: string;
  startLat?: number;
  startLng?: number;
  endLocation: string;
  endLat?: number;
  endLng?: number;
  departureDatetime: string;
  availableSeats: number;
  description?: string;
  requirePhoto?: boolean;
  minRating?: number;
}

export interface UpdateUserInput {
  name?: string;
  bio?: string;
  photo?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  vehicleModel?: string;
  vehicleColor?: string;
  vehiclePlate?: string;
  language?: string;
  pushToken?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}

export interface ClientOptions {
  baseUrl: string;
  getToken?: () => string | null | Promise<string | null>;
}

export interface RideFilters {
  from?: string;
  to?: string;
  date?: string;
  city?: string;
  lat?: number;
  lng?: number;
  radius?: number;
}

export interface RouteResult {
  distanceKm: number;
  encodedPolyline: string;
}

// Decodes a Google Maps encoded polyline into an array of coordinates.
// Pure math — no API key required.
export function decodePolyline(
  encoded: string,
  precision: number = 5,
): { latitude: number; longitude: number }[] {
  const points: { latitude: number; longitude: number }[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({
      latitude: lat / Math.pow(10, precision),
      longitude: lng / Math.pow(10, precision),
    });
  }

  return points;
}

export const createClient = (options: ClientOptions) => {
  const fetchApi = async (endpoint: string, init: RequestInit = {}) => {
    const token = options.getToken ? await options.getToken() : null;
    
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    };

    const response = await fetch(`${options.baseUrl}${endpoint}`, {
      ...init,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Something went wrong");
    }

    return response.json();
  };

  return {
    fetchApi,
    getToken: options.getToken || (() => null),
    auth: {
      login: (data: any): Promise<AuthResponse> => fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
      register: (data: any): Promise<AuthResponse> => fetchApi("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
      refresh: (refreshToken: string): Promise<RefreshResponse> => fetchApi("/auth/refresh", {
        method: "POST",
        headers: { Authorization: `Bearer ${refreshToken}` },
      }),
      logout: (): Promise<void> => fetchApi("/auth/logout", { method: "POST" }),
      getProfile: (): Promise<User> => fetchApi("/auth/profile"),
      updateProfile: (data: UpdateUserInput): Promise<User> => fetchApi("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    },
    users: {
      getOne: (id: string): Promise<User> => fetchApi(`/users/${id}`),
    },
    notifications: {
      getAll: (): Promise<Notification[]> => fetchApi("/notifications"),
      markAsRead: (id: string): Promise<Notification> => fetchApi(`/notifications/${id}/read`, {
        method: "POST",
      }),
    },
    reviews: {
      create: (data: { bookingId: string; targetId: string; rating: number; comment?: string; role: "DRIVER" | "PASSENGER" }): Promise<Review> => fetchApi("/reviews", {
        method: "POST",
        body: JSON.stringify(data),
      }),
      getForUser: (userId: string): Promise<Review[]> => fetchApi(`/reviews/user/${userId}`),
    },
    complaints: {
      create: (data: { bookingId: string; targetId: string; reason: string }): Promise<Complaint> => fetchApi("/complaints", {
        method: "POST",
        body: JSON.stringify(data),
      }),
      getMine: (): Promise<Complaint[]> => fetchApi("/complaints/mine"),
    },
    rides: {
      getMine: (): Promise<Ride[]> => fetchApi("/rides/mine"),
      getAll: (filters?: RideFilters): Promise<Ride[]> => {
        const params = new URLSearchParams();
        if (filters?.from) params.append("from", filters.from);
        if (filters?.to) params.append("to", filters.to);
        if (filters?.date) params.append("date", filters.date);
        if (filters?.city) params.append("city", filters.city);
        if (filters?.lat) params.append("lat", filters.lat.toString());
        if (filters?.lng) params.append("lng", filters.lng.toString());
        if (filters?.radius) params.append("radius", filters.radius.toString());
        
        const queryString = params.toString();
        return fetchApi(`/rides${queryString ? `?${queryString}` : ""}`);
      },
      getOne: (id: string): Promise<Ride> => fetchApi(`/rides/${id}`),
      getRoute: (id: string): Promise<RouteResult | null> => fetchApi(`/rides/${id}/route`),
      create: (data: CreateRideInput): Promise<Ride> => fetchApi("/rides", {
        method: "POST",
        body: JSON.stringify(data),
      }),
      update: (id: string, data: Partial<CreateRideInput>): Promise<Ride> => fetchApi(`/rides/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
      cancelRide: (id: string): Promise<void> => fetchApi(`/rides/${id}/cancel`, {
        method: "POST",
      }),
      completeRide: (id: string): Promise<void> => fetchApi(`/rides/${id}/complete`, {
        method: "POST",
      }),
      delete: (id: string): Promise<void> => fetchApi(`/rides/${id}`, {
        method: "DELETE",
      }),
    },
    bookings: {
      getMine: (): Promise<Booking[]> => fetchApi("/bookings"),
      create: (data: { rideId: string; seatsBooked: number; pickupLocation?: string; dropoffLocation?: string; passengerNotes?: string }): Promise<Booking> => fetchApi("/bookings", {
        method: "POST",
        body: JSON.stringify(data),
      }),
      cancel: (id: string): Promise<Booking> => fetchApi(`/bookings/${id}`, {
        method: "DELETE",
      }),
      confirm: (id: string): Promise<Booking> => fetchApi(`/bookings/${id}/confirm`, {
        method: "POST",
      }),
      reject: (id: string): Promise<Booking> => fetchApi(`/bookings/${id}/reject`, {
        method: "POST",
      }),
    },
  };
};
