import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:animate_do/animate_do.dart';
import '../core/app_theme.dart';
import '../providers/providers.dart';
import '../widgets/glass_card.dart';
import 'login_screen.dart';

/// Profile & Settings screen — user details, stats, reading history, and logout.
class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final profileAsync = ref.watch(userProfileProvider(authState.userId));

    return Scaffold(
      backgroundColor: AppColors.primaryBg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        automaticallyImplyLeading: false,
        title: FadeInDown(
          child: Text('Profile', style: AppTextStyles.heading2),
        ),
        centerTitle: true,
      ),
      body: profileAsync.when(
        data: (profile) => _buildProfileContent(context, ref, profile, authState),
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.cyan),
        ),
        error: (e, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline_rounded,
                  color: AppColors.red, size: 48),
              const SizedBox(height: 12),
              Text('Failed to load profile', style: AppTextStyles.heading3),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.invalidate(
                    userProfileProvider(authState.userId)),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProfileContent(
    BuildContext context,
    WidgetRef ref,
    Map<String, dynamic> profile,
    AuthState authState,
  ) {
    final fullName = profile['full_name'] ?? 'Unknown User';
    final email = profile['email'] ?? 'unknown@example.com';
    final role = profile['role'] ?? 'student';
    final borrowedCount = '${profile['total_borrowed'] ?? 0}';
    final overdueCount = '${profile['total_overdue'] ?? 0}';
    final rank = profile['rank'] ?? 'Bronze';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          const SizedBox(height: 8),

          // Avatar with glow
          FadeInDown(
            delay: const Duration(milliseconds: 100),
            child: Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.cyan, width: 3),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.cyan.withValues(alpha: 0.3),
                    blurRadius: 20,
                    spreadRadius: 3,
                  ),
                ],
              ),
              child: CircleAvatar(
                radius: 52,
                backgroundColor: AppColors.surface,
                child: Text(
                  _getInitials(fullName),
                  style: AppTextStyles.heading1.copyWith(
                    color: AppColors.cyan,
                    fontSize: 32,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 18),

          // Name
          FadeInUp(
            delay: const Duration(milliseconds: 200),
            child: Text(fullName, style: AppTextStyles.heading1),
          ),
          const SizedBox(height: 6),

          // Email
          FadeInUp(
            delay: const Duration(milliseconds: 250),
            child: Text(email, style: AppTextStyles.bodyMedium),
          ),
          const SizedBox(height: 8),

          // Role badge
          if (role == 'librarian')
            FadeInUp(
              delay: const Duration(milliseconds: 300),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.amber.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: AppColors.amber.withValues(alpha: 0.4),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.admin_panel_settings_rounded,
                        size: 16, color: AppColors.amber),
                    const SizedBox(width: 6),
                    Text(
                      'Librarian',
                      style: TextStyle(
                        color: AppColors.amber,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 28),

          // Stat cards row
          FadeInUp(
            delay: const Duration(milliseconds: 350),
            child: Row(
              children: [
                _buildStatTile('Borrowed', borrowedCount, AppColors.purple),
                const SizedBox(width: 12),
                _buildStatTile('Overdue', overdueCount, AppColors.red),
                const SizedBox(width: 12),
                _buildStatTile('Rank', rank, AppColors.amber),
              ],
            ),
          ),
          const SizedBox(height: 28),

          // Settings list
          FadeInUp(
            delay: const Duration(milliseconds: 450),
            child: GlassCard(
              enableBlur: false,
              child: Column(
                children: [
                  _buildListTile(
                    Icons.settings_rounded,
                    'Account Settings',
                    onTap: () {},
                  ),
                  _buildDivider(),
                  _buildListTile(
                    Icons.history_rounded,
                    'Reading History',
                    onTap: () {},
                  ),
                  _buildDivider(),
                  _buildListTile(
                    Icons.notifications_none_rounded,
                    'Notifications',
                    onTap: () {},
                  ),
                  _buildDivider(),
                  _buildListTile(
                    Icons.help_outline_rounded,
                    'Help & Support',
                    onTap: () {},
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Logout button
          FadeInUp(
            delay: const Duration(milliseconds: 550),
            child: SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: () async {
                  await ref.read(authProvider.notifier).logout();
                  if (context.mounted) {
                    Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                      (route) => false,
                    );
                  }
                },
                icon: const Icon(Icons.logout_rounded, color: Colors.white),
                label: const Text(
                  'Logout',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.red,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 100),
        ],
      ),
    );
  }

  Widget _buildStatTile(String label, String value, Color color) {
    return Expanded(
      child: GlassCard(
        enableBlur: false,
        padding: const EdgeInsets.symmetric(vertical: 18),
        child: Column(
          children: [
            Text(
              value,
              style: AppTextStyles.statValue.copyWith(
                color: color,
                fontSize: 24,
              ),
            ),
            const SizedBox(height: 4),
            Text(label, style: AppTextStyles.bodySmall),
          ],
        ),
      ),
    );
  }

  Widget _buildListTile(IconData icon, String title, {VoidCallback? onTap}) {
    return ListTile(
      leading: Icon(icon, color: AppColors.cyan),
      title: Text(title, style: const TextStyle(color: Colors.white)),
      trailing: const Icon(Icons.chevron_right_rounded, color: Colors.white54),
      onTap: onTap,
    );
  }

  Widget _buildDivider() {
    return Divider(
      height: 1,
      thickness: 1,
      color: AppColors.borderSubtle,
      indent: 16,
      endIndent: 16,
    );
  }

  String _getInitials(String name) {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return parts[0].isNotEmpty ? parts[0][0].toUpperCase() : '?';
  }
}
