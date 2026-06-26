import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:animate_do/animate_do.dart';
import '../core/app_theme.dart';
import '../providers/providers.dart';

import 'search_results_screen.dart';
import 'category_books_screen.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final dashboardAsync = ref.watch(userDashboardProvider(authState.userId));
    final featuredAsync = ref.watch(featuredBooksProvider);
    final categoriesAsync = ref.watch(categoriesProvider);

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.cyan,
          onRefresh: () async {
            ref.invalidate(userDashboardProvider(authState.userId));
            ref.invalidate(featuredBooksProvider);
            ref.invalidate(categoriesProvider);
          },
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 1200),
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
              // ── Status Bar / App Bar ─────────────────────────────────────
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 24,
                            backgroundColor: AppColors.cyan.withValues(alpha: 0.2),
                            child: const Icon(Icons.person, color: AppColors.cyan),
                          ),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Hello,',
                                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: AppColors.lightTextSecondary,
                                ),
                              ),
                              Text(
                                authState.userName.isNotEmpty
                                    ? authState.userName.split(' ').first
                                    : 'Reader',
                                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.lightTextPrimary,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      Stack(
                        children: [
                          IconButton(
                            icon: const Icon(Icons.notifications_outlined, color: AppColors.lightTextPrimary, size: 28),
                            onPressed: () {},
                          ),
                          dashboardAsync.when(
                            data: (dashboard) {
                              final unread = dashboard['unread_notifications'] as int? ?? 0;
                              if (unread > 0) {
                                return Positioned(
                                  right: 12,
                                  top: 12,
                                  child: Container(
                                    padding: const EdgeInsets.all(4),
                                    decoration: const BoxDecoration(
                                      color: AppColors.red,
                                      shape: BoxShape.circle,
                                    ),
                                    child: Text(
                                      '$unread',
                                      style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                );
                              }
                              return const SizedBox.shrink();
                            },
                            loading: () => const SizedBox.shrink(),
                            error: (_, __) => const SizedBox.shrink(),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              // ── Search Component ──────────────────────────────────────────
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  child: FadeInDown(
                    delay: const Duration(milliseconds: 100),
                    child: InkWell(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const SearchResultsScreen()),
                        );
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppColors.lightBorderSubtle),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.05),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.search, color: AppColors.lightTextSecondary),
                            const SizedBox(width: 12),
                            Text(
                              'Search books, authors...',
                              style: TextStyle(color: AppColors.lightTextSecondary.withValues(alpha: 0.8), fontSize: 16),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),

              // ── Featured Carousel ─────────────────────────────────────────
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
                  child: FadeInLeft(
                    delay: const Duration(milliseconds: 200),
                    child: Text('Featured Books', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold, color: AppColors.lightTextPrimary)),
                  ),
                ),
              ),
                featuredAsync.when(
                  data: (books) {
                    if (books.isEmpty) {
                      return SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.all(20),
                          child: Center(child: Text('No featured books available.', style: TextStyle(color: AppColors.lightTextSecondary))),
                        ),
                      );
                    }
                    return SliverPadding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      sliver: SliverGrid(
                        gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                          maxCrossAxisExtent: 180,
                          mainAxisSpacing: 16,
                          crossAxisSpacing: 16,
                          childAspectRatio: 0.65,
                        ),
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            final book = books[index];
                            return FadeInUp(
                              delay: Duration(milliseconds: 50 * index),
                              child: Container(
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(16),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.05),
                                      blurRadius: 10,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    ClipRRect(
                                      borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                                      child: Container(
                                        height: 160,
                                        width: double.infinity,
                                        color: AppColors.lightBorderSubtle,
                                        child: book['cover_image_path'] != null && book['cover_image_path'].toString().isNotEmpty
                                            ? Image.network(book['cover_image_path'], fit: BoxFit.cover,
                                                errorBuilder: (_, __, ___) => Icon(Icons.book, size: 40, color: AppColors.lightTextSecondary))
                                            : Icon(Icons.book, size: 40, color: AppColors.lightTextSecondary),
                                      ),
                                    ),
                                    Padding(
                                      padding: const EdgeInsets.all(10.0),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            book['title'] ?? 'Unknown',
                                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.lightTextPrimary),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            book['author'] ?? 'Unknown',
                                            style: TextStyle(fontSize: 12, color: AppColors.lightTextSecondary),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                          childCount: books.length,
                        ),
                      ),
                    );
                  },
                  loading: () => SliverToBoxAdapter(child: SizedBox(height: 220, child: Center(child: CircularProgressIndicator(color: AppColors.cyan)))),
                  error: (e, _) => SliverToBoxAdapter(child: Padding(padding: const EdgeInsets.all(20), child: Text('Error: $e', style: TextStyle(color: AppColors.red)))),
                ),

              // ── Categories Section ────────────────────────────────────────
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
                  child: FadeInLeft(
                    delay: const Duration(milliseconds: 300),
                    child: Text('Categories', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold, color: AppColors.lightTextPrimary)),
                  ),
                ),
              ),
                SliverToBoxAdapter(
                  child: categoriesAsync.when(
                    data: (categories) {
                      if (categories.isEmpty) return const SizedBox.shrink();
                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Wrap(
                          spacing: 12,
                          runSpacing: 12,
                          children: categories.map((cat) {
                            return InkWell(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => CategoryBooksScreen(category: cat),
                                  ),
                                );
                              },
                              borderRadius: BorderRadius.circular(25),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                decoration: BoxDecoration(
                                  color: AppColors.cyan.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(25),
                                  border: Border.all(color: AppColors.cyan.withValues(alpha: 0.3)),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(cat.iconData, color: AppColors.cyan, size: 20),
                                    const SizedBox(width: 8),
                                    Text(
                                      cat.name,
                                      style: const TextStyle(
                                        color: AppColors.cyan,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    if (cat.bookCount > 0) ...[
                                      const SizedBox(width: 6),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: AppColors.cyan.withValues(alpha: 0.2),
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                        child: Text(
                                          '${cat.bookCount}',
                                          style: const TextStyle(
                                            color: AppColors.cyan,
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      );
                    },
                    loading: () => const SizedBox(height: 50, child: Center(child: CircularProgressIndicator(color: AppColors.cyan))),
                    error: (e, _) => Padding(padding: const EdgeInsets.all(20), child: Text('Error: $e', style: const TextStyle(color: AppColors.red))),
                  ),
                ),

              const SliverToBoxAdapter(
                child: SizedBox(height: 100),
              ),
            ],
          ),
        ),
        ),
      ),
      ),
    );
  }
}
