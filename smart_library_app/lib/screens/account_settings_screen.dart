import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:animate_do/animate_do.dart';
import '../core/app_theme.dart';
import '../widgets/glass_card.dart';
import '../providers/theme_provider.dart';
import '../providers/providers.dart';
import '../services/api_service.dart';

class AccountSettingsScreen extends ConsumerStatefulWidget {
  const AccountSettingsScreen({super.key});

  @override
  ConsumerState<AccountSettingsScreen> createState() => _AccountSettingsScreenState();
}

class _AccountSettingsScreenState extends ConsumerState<AccountSettingsScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  bool _pushNotifications = true;
  bool _emailNotifications = true;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadSettings();
    });
  }

  void _loadSettings() async {
    final authState = ref.read(authProvider);
    _nameController.text = authState.userName;
    _emailController.text = authState.user?.email ?? '';
    
    try {
      final apiService = ref.read(apiServiceProvider);
      final response = await apiService.getSettings(authState.userId);
      final settings = response['settings'];
      if (settings != null) {
        setState(() {
          _pushNotifications = settings['push_notifications'] == 1 || settings['push_notifications'] == true;
          _emailNotifications = settings['email_notifications'] == 1 || settings['email_notifications'] == true;
          
          final themeModeStr = settings['theme_mode'];
          if (themeModeStr == 'dark') {
            ref.read(themeProvider.notifier).setThemeMode(ThemeMode.dark);
          } else {
            ref.read(themeProvider.notifier).setThemeMode(ThemeMode.light);
          }
        });
      }
    } catch (e) {
      // Handle silently or show toast
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  void _saveSettings() async {
    setState(() => _isSaving = true);
    try {
      final authState = ref.read(authProvider);
      final apiService = ref.read(apiServiceProvider);
      
      final currentTheme = ref.read(themeProvider);
      final themeModeStr = currentTheme == ThemeMode.dark ? 'dark' : 'light';
      
      await apiService.updateSettings(authState.userId, {
        'push_notifications': _pushNotifications,
        'email_notifications': _emailNotifications,
        'theme_mode': themeModeStr,
        'email': _emailController.text,
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Settings saved successfully!'),
            backgroundColor: AppColors.cyan,
          ),
        );
        ref.invalidate(userSettingsProvider(authState.userId));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error saving settings: $e'),
            backgroundColor: AppColors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: FadeInDown(child: Text('Account Settings', style: AppTextStyles.heading2)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 600),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                FadeInUp(
                  delay: const Duration(milliseconds: 100),
                  child: GlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Personal Information', style: AppTextStyles.heading3),
                        const SizedBox(height: 16),
                        TextField(
                          controller: _nameController,
                          readOnly: true,
                          decoration: const InputDecoration(
                            labelText: 'Full Name',
                          ),
                        ),
                        const SizedBox(height: 16),
                        TextField(
                          controller: _emailController,
                          decoration: const InputDecoration(
                            labelText: 'Email Address',
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                FadeInUp(
                  delay: const Duration(milliseconds: 200),
                  child: GlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Preferences', style: AppTextStyles.heading3),
                        const SizedBox(height: 16),
                        SwitchListTile(
                          title: const Text('Push Notifications'),
                          value: _pushNotifications,
                          activeColor: AppColors.cyan,
                          onChanged: (val) => setState(() => _pushNotifications = val),
                        ),
                        SwitchListTile(
                          title: const Text('Email Notifications'),
                          value: _emailNotifications,
                          activeColor: AppColors.cyan,
                          onChanged: (val) => setState(() => _emailNotifications = val),
                        ),
                        SwitchListTile(
                          title: const Text('Dark Mode'),
                          value: ref.watch(themeProvider) == ThemeMode.dark,
                          activeColor: AppColors.cyan,
                          onChanged: (val) {
                            ref.read(themeProvider.notifier).setThemeMode(val ? ThemeMode.dark : ThemeMode.light);
                          },
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 30),
                FadeInUp(
                  delay: const Duration(milliseconds: 300),
                  child: SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _isSaving ? null : _saveSettings,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.cyan,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: _isSaving 
                          ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white))
                          : const Text('Save Changes', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
