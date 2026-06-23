import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/app_theme.dart';
import 'providers/providers.dart';
import 'screens/onboarding_screen.dart';
import 'screens/login_screen.dart';
import 'screens/main_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: SmartLibraryApp()));
}

class SmartLibraryApp extends StatelessWidget {
  const SmartLibraryApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Smart Library',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: const AppGate(),
    );
  }
}

/// Gate widget that determines the initial screen:
/// 1. Onboarding (first time) → 2. Login (unauthenticated) → 3. MainScreen
class AppGate extends ConsumerStatefulWidget {
  const AppGate({super.key});

  @override
  ConsumerState<AppGate> createState() => _AppGateState();
}

class _AppGateState extends ConsumerState<AppGate> {
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    _initApp();
  }

  Future<void> _initApp() async {
    // Try to restore existing session from SharedPreferences
    await ref.read(authProvider.notifier).tryRestoreSession();

    // The DEV SHORTCUT was removed here so you can see the onboarding
    // and login flow naturally.

    if (mounted) {
      setState(() => _initialized = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_initialized) {
      return Scaffold(
        backgroundColor: AppColors.primaryBg,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.local_library_rounded,
                size: 64,
                color: AppColors.cyan.withValues(alpha: 0.6),
              ),
              const SizedBox(height: 24),
              const CircularProgressIndicator(
                color: AppColors.cyan,
                strokeWidth: 2.5,
              ),
            ],
          ),
        ),
      );
    }

    final authState = ref.watch(authProvider);
    final onboardingSeenAsync = ref.watch(onboardingSeenProvider);

    return onboardingSeenAsync.when(
      data: (hasSeen) {
        if (!hasSeen) {
          return const OnboardingScreen();
        }
        if (authState.isAuthenticated) {
          return const MainScreen();
        }
        return const LoginScreen();
      },
      loading: () => const Scaffold(
        backgroundColor: AppColors.primaryBg,
        body: Center(
          child: CircularProgressIndicator(
            color: AppColors.cyan,
            strokeWidth: 2.5,
          ),
        ),
      ),
      error: (_, __) => const LoginScreen(),
    );
  }
}
