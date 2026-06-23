import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:animate_do/animate_do.dart';
import '../core/app_theme.dart';
import '../widgets/glass_card.dart';

class AccountSettingsScreen extends ConsumerStatefulWidget {
  const AccountSettingsScreen({super.key});

  @override
  ConsumerState<AccountSettingsScreen> createState() => _AccountSettingsScreenState();
}

class _AccountSettingsScreenState extends ConsumerState<AccountSettingsScreen> {
  final _nameController = TextEditingController(text: 'John Doe');
  final _emailController = TextEditingController(text: 'johndoe@example.com');
  bool _pushNotifications = true;
  bool _emailNotifications = true;
  bool _isDarkMode = true;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  void _saveSettings() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Settings saved successfully!'),
        backgroundColor: AppColors.cyan,
      ),
    );
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.primaryBg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: FadeInDown(child: Text('Account Settings', style: AppTextStyles.heading2)),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
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
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        labelText: 'Full Name',
                        labelStyle: const TextStyle(color: Colors.white70),
                        enabledBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Colors.white24)),
                        focusedBorder: const UnderlineInputBorder(borderSide: BorderSide(color: AppColors.cyan)),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _emailController,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        labelText: 'Email Address',
                        labelStyle: const TextStyle(color: Colors.white70),
                        enabledBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Colors.white24)),
                        focusedBorder: const UnderlineInputBorder(borderSide: BorderSide(color: AppColors.cyan)),
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
                      title: const Text('Push Notifications', style: TextStyle(color: Colors.white)),
                      value: _pushNotifications,
                      activeColor: AppColors.cyan,
                      onChanged: (val) => setState(() => _pushNotifications = val),
                    ),
                    SwitchListTile(
                      title: const Text('Email Notifications', style: TextStyle(color: Colors.white)),
                      value: _emailNotifications,
                      activeColor: AppColors.cyan,
                      onChanged: (val) => setState(() => _emailNotifications = val),
                    ),
                    SwitchListTile(
                      title: const Text('Dark Mode', style: TextStyle(color: Colors.white)),
                      value: _isDarkMode,
                      activeColor: AppColors.cyan,
                      onChanged: (val) => setState(() => _isDarkMode = val),
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
                  onPressed: _saveSettings,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.cyan,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text('Save Changes', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
