import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator, StyleSheet, Keyboard } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Input, InputProps } from './Input';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

interface Suggestion {
  place_id: string;
  name: string;
  display_name: string;
  lat: string;
  lon: string;
}

export interface PredictionInputProps extends Omit<InputProps, 'value' | 'onChangeText'> {
  value: string;
  onSelect: (address: string) => void;
}

export function PredictionInput({ value, onSelect, containerStyle, ...props }: PredictionInputProps) {
  const { theme } = useTheme();
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const fetchSuggestions = (text: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim() || text === value) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `${NOMINATIM_URL}?q=${encodeURIComponent(text)}&featuretype=city&format=json&limit=5&addressdetails=0`;
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
    const cityOnly = suggestion.name || suggestion.display_name.split(',')[0];
    setQuery(cityOnly);
    setSuggestions([]);
    onSelect(cityOnly);
  };

  return (
    <View style={[{ zIndex: suggestions.length > 0 ? 999 : 1, overflow: 'visible' }, containerStyle]}>
      <Input
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          fetchSuggestions(text);
          onSelect(text);
        }}
        rightIcon={loading ? <ActivityIndicator size="small" color={theme.primary} /> : undefined}
        containerStyle={{ marginBottom: 0 }} // Let the wrapper handle the margin from the parent if needed
        {...props}
      />
      {suggestions.length > 0 && (
        <View style={[styles.dropdown, { backgroundColor: theme.surface }]}>
          {suggestions.map((item, index) => (
            <TouchableOpacity
              key={item.place_id}
              style={[
                styles.suggestionItem,
                index < suggestions.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
              ]}
              onPress={() => handleSelect(item)}
            >
              <Text style={[styles.suggestionText, { color: theme.text }]} numberOfLines={2}>
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
  dropdown: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
    overflow: 'hidden',
    zIndex: 1000,
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
