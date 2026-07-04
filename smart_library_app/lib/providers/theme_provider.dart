import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

final sharedPreferencesProvider = Provider<SharedPreferences>((ref) {
  throw UnimplementedError('sharedPreferencesProvider must be overridden in ProviderScope');
});

final themeProvider = NotifierProvider<ThemeModeNotifier, ThemeMode>(ThemeModeNotifier.new);

class ThemeModeNotifier extends Notifier<ThemeMode> {
  static const _themeKey = 'theme_mode_key';

  @override
  ThemeMode build() {
    final prefs = ref.watch(sharedPreferencesProvider);
    return _loadThemeMode(prefs);
  }

  static ThemeMode _loadThemeMode(SharedPreferences prefs) {
    final savedMode = prefs.getString(_themeKey);
    if (savedMode == 'light') return ThemeMode.light;
    return ThemeMode.dark; // Default to dark as requested
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    state = mode;
    final prefs = ref.read(sharedPreferencesProvider);
    await prefs.setString(_themeKey, mode.name);
  }

  Future<void> toggleTheme() async {
    final newMode = state == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    await setThemeMode(newMode);
  }
}
