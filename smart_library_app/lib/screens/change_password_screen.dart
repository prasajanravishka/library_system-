import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:animate_do/animate_do.dart';
import '../core/app_theme.dart';
import '../providers/providers.dart';
import 'login_screen.dart';

class ChangePasswordScreen extends ConsumerStatefulWidget {
  final bool forceChange;

  const ChangePasswordScreen({super.key, this.forceChange = false});

  @override
  ConsumerState<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends ConsumerState<ChangePasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  
  bool _obscureCurrent = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;

  @override
  void dispose() {
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final success = await ref.read(authProvider.notifier).changePassword(
          _currentPasswordController.text,
          _newPasswordController.text,
        );

    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Password updated successfully!'),
            backgroundColor: AppColors.cyan,
          ),
        );
        if (!widget.forceChange) {
          Navigator.pop(context);
        }
      } else {
        final authState = ref.read(authProvider);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(authState.error ?? 'Failed to update password'),
            backgroundColor: AppColors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return PopScope(
      canPop: !widget.forceChange,
      child: Scaffold(
        appBar: AppBar(
          title: FadeInDown(
            duration: const Duration(milliseconds: 400),
            child: Text(
              widget.forceChange ? 'Set Secure Password' : 'Change Password',
              style: AppTextStyles.heading2,
            ),
          ),
          automaticallyImplyLeading: !widget.forceChange,
          actions: widget.forceChange
              ? [
                  IconButton(
                    icon: const Icon(Icons.logout_rounded, color: AppColors.red),
                    onPressed: () async {
                      await ref.read(authProvider.notifier).logout();
                      if (context.mounted) {
                        Navigator.of(context).pushAndRemoveUntil(
                          MaterialPageRoute(builder: (_) => const LoginScreen()),
                          (route) => false,
                        );
                      }
                    },
                  )
                ]
              : null,
        ),
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 500),
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (widget.forceChange) ...[
                        FadeInDown(
                          duration: const Duration(milliseconds: 400),
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            margin: const EdgeInsets.only(bottom: 24),
                            decoration: BoxDecoration(
                              color: AppColors.cyan.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: AppColors.cyan.withValues(alpha: 0.3),
                              ),
                            ),
                            child: const Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Icon(Icons.security_rounded, color: AppColors.cyan, size: 24),
                                SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'First Login Action Required',
                                        style: TextStyle(
                                          color: AppColors.cyan,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 15,
                                        ),
                                      ),
                                      SizedBox(height: 6),
                                      Text(
                                        'Please set a personalized password to secure your account. Once changed, the administrator will no longer have access to it.',
                                        style: TextStyle(
                                          color: Colors.white70,
                                          fontSize: 13,
                                          height: 1.4,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                      FadeInUp(
                        duration: const Duration(milliseconds: 400),
                        child: Card(
                          child: Padding(
                            padding: const EdgeInsets.all(20),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                Text(
                                  'Update Credentials',
                                  style: AppTextStyles.heading3.copyWith(
                                    fontSize: 16,
                                    color: AppColors.cyan,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 20),
                                
                                // Current Password
                                TextFormField(
                                  controller: _currentPasswordController,
                                  obscureText: _obscureCurrent,
                                  style: TextStyle(color: isDark ? Colors.white : Colors.black87),
                                  decoration: InputDecoration(
                                    labelText: 'Current Password',
                                    prefixIcon: const Icon(Icons.lock_open_rounded),
                                    suffixIcon: IconButton(
                                      icon: Icon(
                                        _obscureCurrent ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                                        color: AppColors.textSecondary,
                                      ),
                                      onPressed: () => setState(() => _obscureCurrent = !_obscureCurrent),
                                    ),
                                  ),
                                  validator: (val) {
                                    if (val == null || val.isEmpty) {
                                      return 'Please enter your current password';
                                    }
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 16),

                                // New Password
                                TextFormField(
                                  controller: _newPasswordController,
                                  obscureText: _obscureNew,
                                  style: TextStyle(color: isDark ? Colors.white : Colors.black87),
                                  decoration: InputDecoration(
                                    labelText: 'New Password',
                                    prefixIcon: const Icon(Icons.lock_outline_rounded),
                                    suffixIcon: IconButton(
                                      icon: Icon(
                                        _obscureNew ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                                        color: AppColors.textSecondary,
                                      ),
                                      onPressed: () => setState(() => _obscureNew = !_obscureNew),
                                    ),
                                  ),
                                  validator: (val) {
                                    if (val == null || val.isEmpty) {
                                      return 'Please enter a new password';
                                    }
                                    if (val.length < 6) {
                                      return 'Password must be at least 6 characters';
                                    }
                                    if (val == _currentPasswordController.text) {
                                      return 'New password must be different';
                                    }
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 16),

                                // Confirm Password
                                TextFormField(
                                  controller: _confirmPasswordController,
                                  obscureText: _obscureConfirm,
                                  style: TextStyle(color: isDark ? Colors.white : Colors.black87),
                                  decoration: InputDecoration(
                                    labelText: 'Confirm New Password',
                                    prefixIcon: const Icon(Icons.lock_rounded),
                                    suffixIcon: IconButton(
                                      icon: Icon(
                                        _obscureConfirm ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                                        color: AppColors.textSecondary,
                                      ),
                                      onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                                    ),
                                  ),
                                  validator: (val) {
                                    if (val != _newPasswordController.text) {
                                      return 'Passwords do not match';
                                    }
                                    return null;
                                  },
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 28),
                      FadeInUp(
                        duration: const Duration(milliseconds: 450),
                        child: ElevatedButton(
                          onPressed: authState.isLoading ? null : _submit,
                          child: authState.isLoading
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                )
                              : const Text('Update Password'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
