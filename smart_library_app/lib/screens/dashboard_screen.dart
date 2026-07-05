import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:animate_do/animate_do.dart';
import '../core/app_theme.dart';
import '../providers/providers.dart';
import '../widgets/hero_section.dart';
import 'category_books_screen.dart';
import '../widgets/interactive_cards.dart';
import 'all_categories_screen.dart';
import 'all_featured_books_screen.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final featuredAsync = ref.watch(featuredBooksProvider);
    final trendingAsync = ref.watch(trendingBooksProvider);
    final categoriesAsync = ref.watch(categoriesProvider);

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: RefreshIndicator(
        color: AppColors.cyan,
        onRefresh: () async {
          ref.invalidate(userDashboardProvider(authState.userId));
          ref.invalidate(featuredBooksProvider);
          ref.invalidate(trendingBooksProvider);
          ref.invalidate(categoriesProvider);
        },
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
          slivers: [
            // 1. Industrial-Standard Hero Section
            const SliverToBoxAdapter(
              child: HeroSectionWidget(),
            ),

            // 2. Categories Header
            _buildSectionHeader(context, 'Categories', () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const AllCategoriesScreen()));
            }),

            // 3. Categories Horizontal Carousel
            SliverToBoxAdapter(
              child: SizedBox(
                height: 140,
                child: categoriesAsync.when(
                  data: (categories) {
                    if (categories.isEmpty) return const SizedBox.shrink();
                    return ListView.builder(
                      physics: const BouncingScrollPhysics(),
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      itemCount: categories.length,
                      itemBuilder: (context, index) {
                        return CategoryInteractiveCard(
                          cat: categories[index],
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => CategoryBooksScreen(category: categories[index]),
                              ),
                            );
                          },
                        );
                      },
                    );
                  },
                  loading: () => const Center(child: CircularProgressIndicator(color: AppColors.cyan)),
                  error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppColors.red))),
                ),
              ),
            ),

            // Trending Books Header
            _buildSectionHeader(context, 'Trending This Week', () {
              // No-op for now
            }),

            // Trending Books Horizontal Carousel
            SliverToBoxAdapter(
              child: SizedBox(
                height: 240,
                child: trendingAsync.when(
                  data: (books) {
                    if (books.isEmpty) {
                      return Center(child: Text('No trending books.', style: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color)));
                    }
                    return ListView.builder(
                      physics: const BouncingScrollPhysics(),
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      itemCount: books.length,
                      itemBuilder: (context, index) {
                        return FadeInRight(
                          delay: Duration(milliseconds: 50 * index),
                          child: BookInteractiveCard(book: books[index]),
                        );
                      },
                    );
                  },
                  loading: () => const Center(child: CircularProgressIndicator(color: AppColors.cyan)),
                  error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppColors.red))),
                ),
              ),
            ),

            // 4. Featured Books Header
            _buildSectionHeader(context, 'Featured Books', () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const AllFeaturedBooksScreen()));
            }),

            // 5. Featured Books Horizontal Carousel
            SliverToBoxAdapter(
              child: SizedBox(
                height: 240,
                child: featuredAsync.when(
                  data: (books) {
                    if (books.isEmpty) {
                      return Center(child: Text('No featured books available.', style: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color)));
                    }
                    final displayBooks = books.take(5).toList();
                    return ListView.builder(
                      physics: const BouncingScrollPhysics(),
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      itemCount: displayBooks.length,
                      itemBuilder: (context, index) {
                        return FadeInRight(
                          delay: Duration(milliseconds: 50 * index),
                          child: BookInteractiveCard(book: displayBooks[index]),
                        );
                      },
                    );
                  },
                  loading: () => const Center(child: CircularProgressIndicator(color: AppColors.cyan)),
                  error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppColors.red))),
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title, VoidCallback onSeeAll) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface)),
            TextButton(
              onPressed: onSeeAll,
              child: const Text('See All', style: TextStyle(color: AppColors.cyan, fontWeight: FontWeight.w600)),
            ),
          ],
        ),
      ),
    );
  }
}

