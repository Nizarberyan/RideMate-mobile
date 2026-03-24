import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

// Uses OpenStreetMap Nominatim — free, no API key needed
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

interface Suggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
}

interface MapSearchBarProps {
  onSelect: (coords: { latitude: number; longitude: number }, address: string) => void;
}

export function MapSearchBar({ onSelect }: MapSearchBarProps) {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = (text: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url =
          `${NOMINATIM_URL}?q=${encodeURIComponent(text)}` +
          `&format=json&limit=5&addressdetails=0`;
        const res = await fetch(url, {
          headers: { 'Accept-Language': 'en', 'User-Agent': 'RideMateApp/1.0' },
        });
        const json: Suggestion[] = await res.json();
        setSuggestions(Array.isArray(json) ? json : []);
      } catch (e) {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const handleSelect = (suggestion: Suggestion) => {
    Keyboard.dismiss();
    // Format a readable label: trim the long OSM display_name to first two segments
    const short = suggestion.display_name.split(',').slice(0, 3).join(',');
    setQuery(short);
    setSuggestions([]);
    onSelect(
      { latitude: parseFloat(suggestion.lat), longitude: parseFloat(suggestion.lon) },
      short,
    );
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
  };

  return (
    <View style={styles.wrapper}>
      {/* Search Input */}
      <View style={[styles.inputRow, { backgroundColor: theme.surface }]}>
        <Search size={18} color={theme.textMuted} style={{ marginLeft: 14 }} />
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder="Search address..."
          placeholderTextColor={theme.textMuted}
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            fetchSuggestions(text);
          }}
          autoCorrect={false}
          returnKeyType="search"
        />
        {loading ? (
          <ActivityIndicator
            size="small"
            color={theme.primary}
            style={{ marginRight: 14 }}
          />
        ) : query.length > 0 ? (
          <TouchableOpacity onPress={handleClear} style={{ marginRight: 14 }}>
            <X size={18} color={theme.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Suggestions — flows naturally below input so Android doesn't clip them */}
      {suggestions.length > 0 && (
        <View style={[styles.dropdown, { backgroundColor: theme.surface }]}>
          {suggestions.map((item, index) => (
            <TouchableOpacity
              key={item.place_id}
              style={[
                styles.suggestionItem,
                index < suggestions.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: theme.border,
                },
              ]}
              onPress={() => handleSelect(item)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.suggestionText, { color: theme.text }]}
                numberOfLines={2}
              >
                {item.display_name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    zIndex: 999,
    overflow: 'visible',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: 10,
  },
  dropdown: {
    marginTop: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});
