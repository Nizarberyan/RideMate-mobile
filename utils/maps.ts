import Constants from 'expo-constants';

export const getGoogleMapsApiKey = () => {
  return (
    Constants.expoConfig?.ios?.config?.googleMapsApiKey ||
    Constants.expoConfig?.android?.config?.googleMaps?.apiKey ||
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    'AIzaSyBirBHMjQqBegIskSqs_8ThMVgrlDESAr4'
  );
};

export async function getDirections(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
) {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) return null;

  try {
    const response = await fetch(
      'https://routes.googleapis.com/directions/v2:computeRoutes',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'routes.distanceMeters,routes.polyline.encodedPolyline',
        },
        body: JSON.stringify({
          origin: {
            location: {
              latLng: {
                latitude: startLat,
                longitude: startLng,
              },
            },
          },
          destination: {
            location: {
              latLng: {
                latitude: endLat,
                longitude: endLng,
              },
            },
          },
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE',
        }),
      }
    );
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const distanceMeters = route.distanceMeters || 0;
      const distanceKm = distanceMeters / 1000;

      let polylinePoints: {latitude: number; longitude: number}[] = [];
      if (route.polyline?.encodedPolyline) {
        polylinePoints = decodePolyline(route.polyline.encodedPolyline);
      }

      return {
        distanceKm,
        polyline: polylinePoints, // Array of {latitude, longitude}
      };
    } else {
      console.error('Directions API returned no routes or error:', data);
    }
  } catch (error) {
    console.error('Error fetching directions:', error);
  }
  return null;
}

// Helper to decode Google Maps polyline strings
function decodePolyline(t: string, e: number = 5) {
  let points = [];
  let index = 0, len = t.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = t.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = t.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push({ latitude: lat / Math.pow(10, e), longitude: lng / Math.pow(10, e) });
  }

  return points;
}
