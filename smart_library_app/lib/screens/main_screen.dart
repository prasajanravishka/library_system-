import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:animate_do/animate_do.dart';
import '../core/app_theme.dart';
import '../providers/providers.dart';
import 'dashboard_screen.dart';
import 'library_screen.dart';
import 'profile_screen.dart';
import 'scanner_screen.dart';

/// Main scaffold with IndexedStack navigation, center-docked Scanner FAB,
/// and bottom navigation bar (Profile left, My Library right).
class MainScreen extends ConsumerStatefulWidget {
  const MainScreen({super.key});

  @override
  ConsumerState<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends ConsumerState<MainScreen> {
  int _currentIndex = 1; // Default to Dashboard (Home)

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    final screens = [
      const ProfileScreen(),
      const DashboardScreen(),
      const LibraryScreen(),
    ];

    return Scaffold(
      backgroundColor: AppColors.primaryBg,
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),

      // Center-docked Scanner FAB with pulse animation
      floatingActionButton: Pulse(
        infinite: true,
        duration: const Duration(milliseconds: 2000),
        child: Container(
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: AppColors.purple.withValues(alpha: 0.4),
                blurRadius: 20,
                spreadRadius: 2,
              ),
            ],
          ),
          child: FloatingActionButton(
            heroTag: 'scanner_fab',
            backgroundColor: AppColors.purple,
            elevation: 0,
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ScannerScreen()),
              );
            },
            child: const Icon(Icons.document_scanner_rounded, size: 28),
          ),
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,

      // Bottom navigation bar with BottomAppBar for center-docked FAB
      bottomNavigationBar: BottomAppBar(
        color: AppColors.primaryBg,
        elevation: 0,
        notchMargin: 8,
        shape: const CircularNotchedRectangle(),
        child: Container(
          decoration: BoxDecoration(
            border: Border(
              top: BorderSide(
                color: AppColors.borderSubtle,
                width: 1,
              ),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              // Profile tab (left)
              _buildNavItem(
                icon: Icons.person_outline_rounded,
                activeIcon: Icons.person_rounded,
                label: 'Profile',
                index: 0,
              ),
              // Spacer for FAB
              const SizedBox(width: 48),
              // My Library tab (right)
              _buildNavItem(
                icon: Icons.library_books_outlined,
                activeIcon: Icons.library_books_rounded,
                label: authState.isLibrarian ? 'Inventory' : 'My Library',
                index: 2,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required IconData icon,
    required IconData activeIcon,
    required String label,
    required int index,
  }) {
    final isSelected = _currentIndex == index;
    final color = isSelected ? AppColors.cyan : Colors.grey.shade500;

    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _currentIndex = index),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                isSelected ? activeIcon : icon,
                color: color,
                size: 26,
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  color: color,
                  fontSize: 11,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
