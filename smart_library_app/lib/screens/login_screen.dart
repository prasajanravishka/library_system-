import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:animate_do/animate_do.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/app_theme.dart';
import '../core/app_constants.dart';
import '../providers/providers.dart';
import '../widgets/glass_card.dart';
import 'main_screen.dart';

/// Login screen with glassmorphism text fields and cyan gradient button.
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _studentIdController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _studentIdController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _login() async {
    final studentId = _studentIdController.text.trim();
    final password = _passwordController.text;

    if (studentId.isEmpty || password.isEmpty) {
      return;
    }

    final success = await ref
        .read(authProvider.notifier)
        .login(studentId, password);
    if (success && mounted) {
      Navigator.of(
        context,
      ).pushReplacement(MaterialPageRoute(builder: (_) => const MainScreen()));
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Hero icon with glow
                FadeInDown(
                  duration: const Duration(milliseconds: 600),
                  child: Center(
                    child: Container(
                      width: 120,
                      height: 120,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            AppColors.cyan.withValues(alpha: 0.2),
                            AppColors.cyan.withValues(alpha: 0.05),
                            Colors.transparent,
                          ],
                        ),
                      ),
                      child: Container(
                        margin: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.cyan.withValues(alpha: 0.12),
                          border: Border.all(
                            color: AppColors.cyan.withValues(alpha: 0.3),
                            width: 2,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.cyan.withValues(alpha: 0.2),
                              blurRadius: 30,
                              spreadRadius: 5,
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.local_library_rounded,
                          size: 44,
                          color: AppColors.cyan,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 28),

                // Title
                FadeInDown(
                  delay: const Duration(milliseconds: 150),
                  child: Text(
                    'Smart Library',
                    textAlign: TextAlign.center,
                    style: AppTextStyles.heading1.copyWith(
                      fontSize: 32,
                      letterSpacing: 1.0,
                    ),
                  ),
                ),
                const SizedBox(height: 8),

                // Subtitle
                FadeInDown(
                  delay: const Duration(milliseconds: 250),
                  child: Text(
                    'Welcome back, please sign in to continue.',
                    textAlign: TextAlign.center,
                    style: AppTextStyles.bodyLarge.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
                const SizedBox(height: 40),

                // Error message
                if (authState.error != null)
                  FadeInDown(
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      margin: const EdgeInsets.only(bottom: 20),
                      decoration: BoxDecoration(
                        color: AppColors.red.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: AppColors.red.withValues(alpha: 0.4),
                        ),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.error_outline_rounded,
                            color: AppColors.red,
                            size: 20,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              authState.error!,
                              style: const TextStyle(
                                color: AppColors.red,
                                fontSize: 14,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                // Student ID field
                FadeInUp(
                  delay: const Duration(milliseconds: 300),
                  child: TextField(
                    controller: _studentIdController,
                    style: const TextStyle(color: Color.fromARGB(255, 0, 0, 0)),
                    decoration: const InputDecoration(
                      labelText: 'Student ID',
                      prefixIcon: Icon(Icons.badge_outlined),
                    ),
                    textInputAction: TextInputAction.next,
                  ),
                ),
                const SizedBox(height: 18),

                // Password field
                FadeInUp(
                  delay: const Duration(milliseconds: 400),
                  child: TextField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    style: const TextStyle(color: Color.fromARGB(255, 5, 5, 5)),
                    decoration: InputDecoration(
                      labelText: 'Password',
                      prefixIcon: const Icon(Icons.lock_outline_rounded),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword
                              ? Icons.visibility_off_rounded
                              : Icons.visibility_rounded,
                          color: AppColors.textSecondary,
                        ),
                        onPressed: () {
                          setState(() => _obscurePassword = !_obscurePassword);
                        },
                      ),
                    ),
                    textInputAction: TextInputAction.done,
                    onSubmitted: (_) => _login(),
                  ),
                ),
                const SizedBox(height: 32),

                // Sign In button with gradient
                FadeInUp(
                  delay: const Duration(milliseconds: 500),
                  child: Container(
                    height: 56,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(14),
                      gradient: const LinearGradient(
                        colors: [
                          AppColors.cyan,
                          Color(0xFF0891B2), // Darker cyan
                        ],
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.cyan.withValues(alpha: 0.3),
                          blurRadius: 16,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: ElevatedButton(
                      onPressed: authState.isLoading ? null : _login,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: authState.isLoading
                          ? const SizedBox(
                              height: 24,
                              width: 24,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2.5,
                              ),
                            )
                          : const Text(
                              'Sign In',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                                color: Colors.white,
                              ),
                            ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Demo credentials hint
                FadeInUp(
                  delay: const Duration(milliseconds: 600),
                  child: GlassCard(
                    enableBlur: false,
                    padding: const EdgeInsets.all(14),
                    child: Row(
                      children: [
                        Icon(
                          Icons.info_outline_rounded,
                          color: AppColors.cyan.withValues(alpha: 0.7),
                          size: 18,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'Demo: S12345 / password123',
                            style: AppTextStyles.bodySmall.copyWith(
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            TextButton.icon(
              onPressed: () async {
                final prefs = await SharedPreferences.getInstance();
                await prefs.remove(AppConstants.prefOnboardingSeen);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Onboarding reset! Restart app to see it.'),
                      backgroundColor: AppColors.cyan,
                    ),
                  );
                }
              },
              icon: Icon(
                Icons.restart_alt_rounded,
                color: AppColors.textSecondary,
              ),
              label: Text(
                'Reset Onboarding',
                style: TextStyle(color: AppColors.textSecondary),
              ),
            ),
            const SizedBox(width: 16),
            TextButton.icon(
              onPressed: () async {
                final apiService = ref.read(apiServiceProvider);
                final success = await apiService.testUserDatabaseConnection();
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        success
                            ? 'Success: Check Console'
                            : 'Connection Failed',
                        style: const TextStyle(color: Colors.white),
                      ),
                      backgroundColor: success
                          ? AppColors.emerald
                          : AppColors.red,
                    ),
                  );
                }
              },
              icon: const Icon(Icons.bug_report_rounded, color: AppColors.cyan),
              label: const Text(
                'Test DB Connection',
                style: TextStyle(color: AppColors.cyan),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
