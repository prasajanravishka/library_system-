import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:animate_do/animate_do.dart';
import '../core/app_theme.dart';
import '../providers/theme_provider.dart';
import '../providers/providers.dart';
import 'change_password_screen.dart';

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
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: FadeInDown(
          duration: const Duration(milliseconds: 400),
          child: Text('Account Settings', style: AppTextStyles.heading2),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 600),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Personal Information Section
                  FadeInUp(
                    duration: const Duration(milliseconds: 400),
                    child: _buildSectionHeader('Personal Information'),
                  ),
                  const SizedBox(height: 8),
                  FadeInUp(
                    duration: const Duration(milliseconds: 400),
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            TextField(
                              controller: _nameController,
                              readOnly: true,
                              decoration: const InputDecoration(
                                labelText: 'Full Name',
                                prefixIcon: Icon(Icons.person_outline_rounded),
                              ),
                            ),
                            const SizedBox(height: 16),
                            TextField(
                              controller: _emailController,
                              style: TextStyle(
                                color: isDark ? Colors.white : Colors.black87,
                              ),
                              decoration: const InputDecoration(
                                labelText: 'Email Address',
                                prefixIcon: Icon(Icons.email_outlined),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Security Section
                  FadeInUp(
                    duration: const Duration(milliseconds: 450),
                    child: _buildSectionHeader('Security'),
                  ),
                  const SizedBox(height: 8),
                  FadeInUp(
                    duration: const Duration(milliseconds: 450),
                    child: Card(
                      child: ListTile(
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        leading: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppColors.cyan.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.lock_outline_rounded, color: AppColors.cyan),
                        ),
                        title: const Text('Change Password'),
                        subtitle: const Text('Update and secure your account credentials'),
                        trailing: const Icon(Icons.chevron_right_rounded),
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const ChangePasswordScreen(forceChange: false),
                            ),
                          );
                        },
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Preferences Section
                  FadeInUp(
                    duration: const Duration(milliseconds: 500),
                    child: _buildSectionHeader('Preferences'),
                  ),
                  const SizedBox(height: 8),
                  FadeInUp(
                    duration: const Duration(milliseconds: 500),
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        child: Column(
                          children: [
                            SwitchListTile(
                              title: const Text('Push Notifications'),
                              subtitle: const Text('Receive alerts for book returns and fines'),
                              value: _pushNotifications,
                              onChanged: (val) => setState(() => _pushNotifications = val),
                            ),
                            const Divider(height: 1, indent: 16, endIndent: 16),
                            SwitchListTile(
                              title: const Text('Email Notifications'),
                              subtitle: const Text('Get monthly reading reports and notices'),
                              value: _emailNotifications,
                              onChanged: (val) => setState(() => _emailNotifications = val),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 36),

                  // Actions Section
                  FadeInUp(
                    duration: const Duration(milliseconds: 550),
                    child: ElevatedButton(
                      onPressed: _isSaving ? null : _saveSettings,
                      child: _isSaving 
                          ? const SizedBox(
                              height: 20, 
                              width: 20, 
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                            )
                          : const Text('Save Changes'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 4),
      child: Text(
        title,
        style: AppTextStyles.heading3.copyWith(
          fontSize: 15,
          color: AppColors.cyan,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
