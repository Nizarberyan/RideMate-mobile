import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Text,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

interface Suggestion {
  place_id: string;
  description: string;
}

interface MapSearchBarProps {
  onSelect: (coords: { latitude: number; longitude: number }, address: string) => void;
}

export function MapSearchBar({ onSelect }: MapSearchBarProps) {
  const { theme, isDark } = useTheme();
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
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${GOOGLE_API_KEY}&language=en`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.predictions) {
          setSuggestions(json.predictions.map((p: any) => ({
            place_id: p.place_id,
            description: p.description,
          })));
        }
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const handleSelect = async (suggestion: Suggestion) => {
    Keyboard.dismiss();
    setQuery(suggestion.description);
    setSuggestions([]);
    setLoading(true);
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${suggestion.place_id}&fields=geometry&key=${GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const json = await res.json();
      const loc = json.result?.geometry?.location;
      if (loc) {
        onSelect({ latitude: loc.lat, longitude: loc.lng }, suggestion.description);
      }
    } catch {
      // silently fail — user can still pan map manually
    } finally {
      setLoading(false);
    }
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
          <ActivityIndicator size="small" color={theme.primary} style={{ marginRight: 14 }} />
        ) : query.length > 0 ? (
          <TouchableOpacity onPress={handleClear} style={{ marginRight: 14 }}>
            <X size={18} color={theme.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Suggestions Dropdown */}
      {suggestions.length > 0 && (
        <View style={[styles.dropdown, { backgroundColor: theme.surface }]}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.place_id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.suggestionItem,
                  index < suggestions.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                ]}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
              >
                <Text style={[styles.suggestionText, { color: theme.text }]} numberOfLines={2}>
                  {item.description}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    zIndex: 99,
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
    position: 'absolute',
    top: 54,
    left: 0,
    right: 0,
    borderRadius: 20,
    maxHeight: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
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
