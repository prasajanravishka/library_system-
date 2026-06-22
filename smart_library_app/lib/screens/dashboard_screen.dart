import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:animate_do/animate_do.dart';
import '../core/app_theme.dart';
import '../providers/providers.dart';
import '../widgets/search_bar_widget.dart';
import '../widgets/stat_card.dart';
import '../widgets/glass_card.dart';
import 'search_results_screen.dart';

/// Dashboard screen with dynamic greeting, pinned search bar,
/// glassmorphism stat cards, and active reads horizontal scroll.
class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final statsAsync = ref.watch(dashboardStatsProvider);
    final dashboardAsync = ref.watch(userDashboardProvider(authState.userId));

    return Scaffold(
      backgroundColor: AppColors.primaryBg,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.cyan,
          backgroundColor: AppColors.surface,
          onRefresh: () async {
            ref.invalidate(dashboardStatsProvider);
            ref.invalidate(userDashboardProvider(authState.userId));
          },
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              // ── Greeting + Search ─────────────────────────────────────
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Greeting
                      FadeInDown(
                        duration: const Duration(milliseconds: 500),
                        child: Text(
                          '${_getGreeting()},',
                          style: AppTextStyles.bodyLarge.copyWith(
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ),
                      const SizedBox(height: 4),
                      FadeInDown(
                        delay: const Duration(milliseconds: 100),
                        child: Text(
                          authState.userName.isNotEmpty
                              ? authState.userName.split(' ').first
                              : 'Reader',
                          style: AppTextStyles.heading1,
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Search bar
                      FadeInDown(
                        delay: const Duration(milliseconds: 200),
                        child: SearchBarWidget(
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => const SearchResultsScreen(),
                              ),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),

              // ── Stat Cards ────────────────────────────────────────────
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: statsAsync.when(
                    data: (stats) {
                      return Row(
                        children: [
                          FadeInUp(
                            delay: const Duration(milliseconds: 200),
                            child: StatCard(
                              label: 'Total Books',
                              value: '${stats['total_books'] ?? 0}',
                              icon: Icons.menu_book_rounded,
                              accentColor: AppColors.emerald,
                            ),
                          ),
                          const SizedBox(width: 12),
                          FadeInUp(
                            delay: const Duration(milliseconds: 350),
                            child: StatCard(
                              label: 'Active\nBorrows',
                              value: '${stats['active_borrows'] ?? 0}',
                              icon: Icons.swap_horiz_rounded,
                              accentColor: AppColors.cyan,
                            ),
                          ),
                          const SizedBox(width: 12),
                          FadeInUp(
                            delay: const Duration(milliseconds: 500),
                            child: StatCard(
                              label: 'Overdue',
                              value: '${stats['overdue'] ?? 0}',
                              icon: Icons.warning_amber_rounded,
                              accentColor: AppColors.red,
                            ),
                          ),
                        ],
                      );
                    },
                    loading: () => Row(
                      children: List.generate(
                        3,
                        (_) => Expanded(
                          child: GlassCard(
                            enableBlur: false,
                            padding: const EdgeInsets.all(24),
                            child: const Center(
                              child: SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: AppColors.cyan,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ).expand((w) => [w, const SizedBox(width: 12)]).toList()
                        ..removeLast(),
                    ),
                    error: (e, _) => Center(
                      child: Text('Error: $e',
                          style: const TextStyle(color: AppColors.red)),
                    ),
                  ),
                ),
              ),

              // ── Active Reads Section ──────────────────────────────────
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 28, 20, 12),
                  child: FadeInLeft(
                    delay: const Duration(milliseconds: 400),
                    child: Text('Active Reads', style: AppTextStyles.heading2),
                  ),
                ),
              ),

              SliverToBoxAdapter(
                child: dashboardAsync.when(
                  data: (dashboard) {
                    final activeReads =
                        dashboard['active_reads'] as List<dynamic>? ?? [];

                    if (activeReads.isEmpty) {
                      return FadeInUp(
                        delay: const Duration(milliseconds: 500),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          child: GlassCard(
                            enableBlur: false,
                            padding: const EdgeInsets.all(32),
                            child: Column(
                              children: [
                                Icon(Icons.auto_stories_rounded,
                                    size: 48,
                                    color: AppColors.textSecondary
                                        .withValues(alpha: 0.4)),
                                const SizedBox(height: 12),
                                Text(
                                  'No active reads',
                                  style: AppTextStyles.heading3.copyWith(
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Scan a book cover to get started!',
                                  style: AppTextStyles.bodyMedium,
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }

                    return SizedBox(
                      height: 200,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        itemCount: activeReads.length,
                        itemBuilder: (context, index) {
                          final book = activeReads[index];
                          final daysLeft = book['days_left'] as int? ?? 0;
                          final isOverdue = daysLeft < 0;

                          return FadeInRight(
                            delay: Duration(milliseconds: 100 * index),
                            child: Container(
                              width: 150,
                              margin: const EdgeInsets.only(right: 14),
                              decoration: GlassDecoration.card(
                                borderColor: isOverdue
                                    ? AppColors.red.withValues(alpha: 0.4)
                                    : AppColors.borderSubtle,
                              ),
                              child: Padding(
                                padding: const EdgeInsets.all(14),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: AppColors.purple
                                            .withValues(alpha: 0.15),
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(
                                        Icons.auto_stories_rounded,
                                        color: AppColors.purple,
                                        size: 28,
                                      ),
                                    ),
                                    const SizedBox(height: 14),
                                    Text(
                                      book['title'] ?? 'Unknown',
                                      style: AppTextStyles.bodyMedium.copyWith(
                                        color: AppColors.textPrimary,
                                        fontWeight: FontWeight.w600,
                                      ),
                                      textAlign: TextAlign.center,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const Spacer(),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: (isOverdue
                                                ? AppColors.red
                                                : AppColors.cyan)
                                            .withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        isOverdue
                                            ? 'Overdue'
                                            : '$daysLeft days left',
                                        style: TextStyle(
                                          color: isOverdue
                                              ? AppColors.red
                                              : AppColors.cyan,
                                          fontSize: 11,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    );
                  },
                  loading: () => const SizedBox(
                    height: 200,
                    child: Center(
                      child: CircularProgressIndicator(color: AppColors.cyan),
                    ),
                  ),
                  error: (e, _) => Padding(
                    padding: const EdgeInsets.all(20),
                    child: Text('Error: $e',
                        style: const TextStyle(color: AppColors.red)),
                  ),
                ),
              ),

              // Bottom padding
              const SliverToBoxAdapter(
                child: SizedBox(height: 100),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
