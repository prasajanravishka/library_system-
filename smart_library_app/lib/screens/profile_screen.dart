import 'dart:ui';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:animate_do/animate_do.dart';
import 'package:image_picker/image_picker.dart';
import '../core/app_theme.dart';
import '../providers/providers.dart';
import '../providers/theme_provider.dart';
import '../widgets/glass_card.dart';
import 'login_screen.dart';
import 'account_settings_screen.dart';
import 'reading_history_screen.dart';
import 'notifications_screen.dart';
import 'support_screen.dart';
import 'payment_history_screen.dart';

/// Profile & Settings screen — user details, stats, reading history, and logout.
class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final profileAsync = ref.watch(userProfileProvider(authState.userId));

    return Scaffold(
      
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
              const SizedBox(height: 12),
              TextButton.icon(
                onPressed: () async {
                  await ref.read(authProvider.notifier).logout();
                  if (context.mounted) {
                    Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                      (route) => false,
                    );
                  }
                },
                icon: const Icon(Icons.logout, color: AppColors.red),
                label: const Text('Logout', style: TextStyle(color: AppColors.red)),
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
    final themeMode = ref.watch(themeProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final fullName = profile['full_name'] ?? 'Unknown User';
    final email = profile['email'] ?? 'unknown@example.com';
    final role = profile['role'] ?? 'student';
    final borrowedCount = '${profile['total_books_read'] ?? profile['total_borrowed'] ?? 0}';
    final overdueCount = '${profile['total_overdue'] ?? 0}';
    final rank = profile['rank'] ?? 'Bronze';
    final badgeIconString = profile['badge_icon'] ?? 'military_tech';
    final fines = profile['total_fines_pending']?.toString() ?? '0';
    final hasPendingPayment = profile['has_pending_payment'] ?? false;

    IconData badgeIcon = Icons.military_tech;
    if (badgeIconString == 'emoji_events') badgeIcon = Icons.emoji_events;
    if (badgeIconString == 'workspace_premium') badgeIcon = Icons.workspace_premium;

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
                _buildStatTile('Read', borrowedCount, AppColors.purple, Icons.menu_book),
                const SizedBox(width: 12),
                _buildStatTile('Overdue', overdueCount, AppColors.red, Icons.warning_amber_rounded),
                const SizedBox(width: 12),
                _buildStatTile('Rank', rank, AppColors.amber, badgeIcon),
              ],
            ),
          ),
          if (double.tryParse(fines) != null && double.parse(fines) > 0) ...[
            const SizedBox(height: 16),
            FadeInUp(
              delay: const Duration(milliseconds: 400),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: hasPendingPayment 
                      ? AppColors.amber.withValues(alpha: 0.1) 
                      : AppColors.red.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: hasPendingPayment 
                        ? AppColors.amber.withValues(alpha: 0.3) 
                        : AppColors.red.withValues(alpha: 0.3),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      hasPendingPayment ? Icons.hourglass_empty_rounded : Icons.money_off, 
                      color: hasPendingPayment ? AppColors.amber : AppColors.red
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        hasPendingPayment 
                            ? 'Fines: LKR $fines (Pending Approval)'
                            : 'Pending Fines: LKR $fines',
                        style: TextStyle(
                          color: hasPendingPayment ? AppColors.amber : AppColors.red,
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                    ),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: hasPendingPayment ? Colors.grey : AppColors.red,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                      ),
                      onPressed: hasPendingPayment ? null : () {
                        _showReceiptUploadSheet(context, ref, authState.userId);
                      },
                      child: Text(hasPendingPayment ? 'Pending' : 'Upload Slip'),
                    )
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 28),

          // Appearance settings
          FadeInUp(
            delay: const Duration(milliseconds: 450),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4.0, vertical: 8.0),
                  child: Text('Appearance', style: AppTextStyles.heading3),
                ),
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                    child: Container(
                      decoration: BoxDecoration(
                        color: Theme.of(context).cardTheme.color ?? (isDark ? const Color(0xCC1E293B) : const Color(0xCCFFFFFF)),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isDark 
                              ? Colors.white.withValues(alpha: 0.1) 
                              : Colors.black.withValues(alpha: 0.05),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.05),
                            blurRadius: 10,
                            spreadRadius: 1,
                          )
                        ],
                      ),
                      child: Column(
                        children: [
                          _ThemeOptionTile(
                            title: 'System Default',
                            icon: Icons.brightness_auto_rounded,
                            isSelected: themeMode == ThemeMode.system,
                            onTap: () => ref.read(themeProvider.notifier).setThemeMode(ThemeMode.system),
                          ),
                          _buildDivider(),
                          _ThemeOptionTile(
                            title: 'Light Mode',
                            icon: Icons.wb_sunny_rounded,
                            isSelected: themeMode == ThemeMode.light,
                            onTap: () => ref.read(themeProvider.notifier).setThemeMode(ThemeMode.light),
                          ),
                          _buildDivider(),
                          _ThemeOptionTile(
                            title: 'Dark Mode',
                            icon: Icons.nights_stay_rounded,
                            isSelected: themeMode == ThemeMode.dark,
                            onTap: () => ref.read(themeProvider.notifier).setThemeMode(ThemeMode.dark),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 28),

          // Settings list
          FadeInUp(
            delay: const Duration(milliseconds: 500),
            child: GlassCard(
              enableBlur: false,
              child: Column(
                children: [
                  _buildListTile(
                    context,
                    Icons.settings_rounded,
                    'Account Settings',
                    onTap: () {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const AccountSettingsScreen()));
                    },
                  ),
                  _buildDivider(),
                  _buildListTile(
                    context,
                    Icons.history_rounded,
                    'Reading History',
                    onTap: () {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const ReadingHistoryScreen()));
                    },
                  ),
                  _buildDivider(),
                  _buildListTile(
                    context,
                    Icons.receipt_long_rounded,
                    'Payment History',
                    onTap: () {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const PaymentHistoryScreen()));
                    },
                  ),
                  _buildDivider(),
                  _buildListTile(
                    context,
                    Icons.notifications_none_rounded,
                    'Notifications',
                    onTap: () {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen()));
                    },
                  ),
                  _buildDivider(),
                  _buildListTile(
                    context,
                    Icons.help_outline_rounded,
                    'Help & Support',
                    onTap: () {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const SupportScreen()));
                    },
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

  Widget _buildStatTile(String label, String value, Color color, [IconData? icon]) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 18),
        decoration: BoxDecoration(
          color: const Color(0xFF1E2130), // Dark card background
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white10),
        ),
        child: Column(
          children: [
            if (icon != null) ...[
              Icon(icon, color: color, size: 28),
              const SizedBox(height: 8),
            ],
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                value,
                style: AppTextStyles.statValue.copyWith(
                  color: color,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildListTile(BuildContext context, IconData icon, String title, {VoidCallback? onTap}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return ListTile(
      leading: Icon(icon, color: AppColors.cyan),
      title: Text(title), // Automatically uses theme text color
      trailing: Icon(Icons.chevron_right_rounded, color: isDark ? Colors.white54 : Colors.black54),
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

class _ThemeOptionTile extends StatelessWidget {
  final String title;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _ThemeOptionTile({
    required this.title,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(
        icon, 
        color: isSelected ? AppColors.cyan : null,
      ),
      title: Text(
        title,
        style: TextStyle(
          fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
          color: isSelected ? AppColors.cyan : null,
        ),
      ),
      trailing: isSelected 
          ? const Icon(Icons.check_circle_rounded, color: AppColors.cyan) 
          : null,
      onTap: onTap,
    );
  }
}

void _showReceiptUploadSheet(BuildContext context, WidgetRef ref, int userId) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => _ReceiptUploadBottomSheet(userId: userId),
  );
}

class _ReceiptUploadBottomSheet extends ConsumerStatefulWidget {
  final int userId;

  const _ReceiptUploadBottomSheet({required this.userId});

  @override
  ConsumerState<_ReceiptUploadBottomSheet> createState() => _ReceiptUploadBottomSheetState();
}

class _ReceiptUploadBottomSheetState extends ConsumerState<_ReceiptUploadBottomSheet> {
  File? _selectedImage;
  int? _selectedBorrowId;
  bool _isUploading = false;
  String? _uploadError;
  List<dynamic> _unpaidFines = [];
  bool _isLoadingFines = true;

  @override
  void initState() {
    super.initState();
    _loadUnpaidFines();
  }

  void _loadUnpaidFines() async {
    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.getUnpaidFines();
      if (mounted) {
        setState(() {
          _unpaidFines = res['fines'] ?? [];
          if (_unpaidFines.isNotEmpty) {
            _selectedBorrowId = _unpaidFines[0]['borrow_id'];
          }
          _isLoadingFines = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isLoadingFines = false);
      }
    }
  }

  void _pickImage(ImageSource source) async {
    try {
      final picker = ImagePicker();
      final picked = await picker.pickImage(source: source);
      if (picked != null && mounted) {
        setState(() => _selectedImage = File(picked.path));
      }
    } catch (e) {
      setState(() => _uploadError = 'Failed to select image: $e');
    }
  }

  void _submitReceipt() async {
    if (_selectedBorrowId == null || _selectedImage == null) return;

    setState(() {
      _isUploading = true;
      _uploadError = null;
    });

    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.uploadReceipt(_selectedBorrowId!, _selectedImage!.path);
      
      if (res['status'] == 'success') {
        ref.invalidate(userProfileProvider(widget.userId));
        ref.invalidate(paymentHistoryProvider);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Slip uploaded successfully! Pending verification.'),
              backgroundColor: AppColors.cyan,
            ),
          );
          Navigator.pop(context);
        }
      } else {
        setState(() {
          _isUploading = false;
          _uploadError = res['message'] ?? 'Upload failed';
        });
      }
    } catch (e) {
      setState(() {
        _isUploading = false;
        _uploadError = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E2130) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Upload Payment Slip',
                style: AppTextStyles.heading3.copyWith(fontWeight: FontWeight.bold),
              ),
              IconButton(
                icon: const Icon(Icons.close_rounded),
                onPressed: () => Navigator.pop(context),
              )
            ],
          ),
          const SizedBox(height: 16),
          if (_isLoadingFines) ...[
            const Center(child: CircularProgressIndicator(color: AppColors.cyan)),
          ] else if (_unpaidFines.isEmpty) ...[
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Text(
                'No outstanding fines found to upload a receipt for.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey),
              ),
            ),
          ] else ...[
            // Select book fine dropdown
            const Text(
              'Select Overdue Book Fine',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.grey),
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<int>(
              value: _selectedBorrowId,
              dropdownColor: isDark ? const Color(0xFF1E2130) : Colors.white,
              decoration: const InputDecoration(
                contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
              items: _unpaidFines.map<DropdownMenuItem<int>>((f) {
                final text = '${f['book_title']} (LKR ${f['fine_amount']})';
                return DropdownMenuItem<int>(
                  value: f['borrow_id'],
                  child: Text(text, maxLines: 1, overflow: TextOverflow.ellipsis),
                );
              }).toList(),
              onChanged: (val) {
                setState(() => _selectedBorrowId = val);
              },
            ),
            const SizedBox(height: 20),

            // Select receipt image
            const Text(
              'Select Payment Slip Image',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.grey),
            ),
            const SizedBox(height: 8),
            if (_selectedImage != null) ...[
              Container(
                height: 140,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey.withValues(alpha: 0.3)),
                  image: DecorationImage(
                    image: FileImage(_selectedImage!),
                    fit: BoxFit.cover,
                  ),
                ),
                child: Align(
                  alignment: Alignment.topRight,
                  child: IconButton(
                    icon: const Icon(Icons.cancel_rounded, color: Colors.white, size: 28),
                    onPressed: () => setState(() => _selectedImage = null),
                  ),
                ),
              ),
            ] else ...[
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.photo_library_outlined),
                      label: const Text('Gallery'),
                      onPressed: () => _pickImage(ImageSource.gallery),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.camera_alt_outlined),
                      label: const Text('Camera'),
                      onPressed: () => _pickImage(ImageSource.camera),
                    ),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 24),
            if (_uploadError != null) ...[
              Text(
                _uploadError!,
                style: const TextStyle(color: AppColors.red, fontSize: 13),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
            ],

            ElevatedButton(
              onPressed: (_selectedImage == null || _isUploading) ? null : _submitReceipt,
              child: _isUploading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : const Text('Submit Slip for Verification'),
            ),
          ],
        ],
      ),
    );
  }
}
