import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:animate_do/animate_do.dart';
import '../core/app_theme.dart';
import '../providers/providers.dart';
import '../models/category_model.dart';
import 'search_results_screen.dart';
import 'category_books_screen.dart';
import 'book_detail_screen.dart';
import 'notifications_screen.dart';

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
      body: RefreshIndicator(
        color: AppColors.cyan,
        onRefresh: () async {
          ref.invalidate(userDashboardProvider(authState.userId));
          ref.invalidate(featuredBooksProvider);
          ref.invalidate(categoriesProvider);
        },
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
          slivers: [
            // 1. Premium Hero Section
            SliverToBoxAdapter(
              child: _buildHeroSection(context, authState, dashboardAsync),
            ),

            // 2. Categories Header
            _buildSectionHeader(context, 'Categories', () {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('All Categories screen coming soon!')));
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
                  error: (e, _) => Center(child: Text('Error: \', style: const TextStyle(color: AppColors.red))),
                ),
              ),
            ),

            // 4. Featured Books Header
            _buildSectionHeader(context, 'Featured Books', () {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('All Featured Books screen coming soon!')));
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
                  error: (e, _) => Center(child: Text('Error: \', style: const TextStyle(color: AppColors.red))),
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
    );
  }

  Widget _buildHeroSection(BuildContext context, AuthState authState, AsyncValue dashboardAsync) {
    final topPadding = MediaQuery.of(context).padding.top;
    return SizedBox(
      height: 200 + topPadding,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            height: 170 + topPadding,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [AppColors.cyan, AppColors.purple],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(30),
                bottomRight: Radius.circular(30),
              ),
            ),
          ),
          Positioned(
            top: topPadding + 20,
            left: 20,
            right: 20,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 24,
                      backgroundColor: Colors.white.withOpacity(0.2),
                      child: const Icon(Icons.person, color: Colors.white),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Hello,', style: TextStyle(color: Colors.white70, fontSize: 14)),
                        Text(
                          authState.userName.isNotEmpty ? authState.userName.split(' ').first : 'Reader',
                          style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ],
                ),
                Stack(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.notifications_outlined, color: Colors.white, size: 28),
                      onPressed: () {
                        Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen()));
                      },
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
                              decoration: const BoxDecoration(color: AppColors.red, shape: BoxShape.circle),
                              child: Text('\', style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
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
          Positioned(
            bottom: 5,
            left: 20,
            right: 20,
            child: InkWell(
              onTap: () {
                Navigator.push(context, MaterialPageRoute(builder: (_) => const SearchResultsScreen()));
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10, offset: const Offset(0, 4))],
                ),
                child: Row(
                  children: [
                    Icon(Icons.search, color: Theme.of(context).textTheme.bodyMedium?.color),
                    const SizedBox(width: 12),
                    Text('Search books, authors...', style: TextStyle(color: (Theme.of(context).textTheme.bodyMedium?.color ?? Colors.grey).withOpacity(0.8), fontSize: 16)),
                  ],
                ),
              ),
            ),
          ),
        ],
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

class CategoryInteractiveCard extends StatefulWidget {
  final CategoryModel cat;
  final VoidCallback onTap;
  
  const CategoryInteractiveCard({super.key, required this.cat, required this.onTap});

  @override
  State<CategoryInteractiveCard> createState() => _CategoryInteractiveCardState();
}

class _CategoryInteractiveCardState extends State<CategoryInteractiveCard> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapUp: (_) => setState(() => _isPressed = false),
      onTapCancel: () => setState(() => _isPressed = false),
      onTap: widget.onTap,
      child: AnimatedScale(
        scale: _isPressed ? 0.95 : 1.0,
        duration: const Duration(milliseconds: 150),
        child: Container(
          width: 120,
          margin: const EdgeInsets.only(right: 16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
            border: Border.all(color: AppColors.cyan.withOpacity(0.2)),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: AppColors.cyan.withOpacity(0.1), shape: BoxShape.circle),
                child: Icon(widget.cat.iconData, color: AppColors.cyan, size: 28),
              ),
              const SizedBox(height: 12),
              Text(
                widget.cat.name,
                textAlign: TextAlign.center,
                style: TextStyle(color: Theme.of(context).colorScheme.onSurface, fontWeight: FontWeight.w600, fontSize: 13),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class BookInteractiveCard extends StatefulWidget {
  final Map<String, dynamic> book;
  
  const BookInteractiveCard({super.key, required this.book});

  @override
  State<BookInteractiveCard> createState() => _BookInteractiveCardState();
}

class _BookInteractiveCardState extends State<BookInteractiveCard> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapUp: (_) => setState(() => _isPressed = false),
      onTapCancel: () => setState(() => _isPressed = false),
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => BookDetailScreen(
              bookId: widget.book['book_id'] is String 
                  ? int.parse(widget.book['book_id']) 
                  : widget.book['book_id'] as int
            ),
          ),
        );
      },
      child: AnimatedScale(
        scale: _isPressed ? 0.95 : 1.0,
        duration: const Duration(milliseconds: 150),
        child: Container(
          width: 140,
          margin: const EdgeInsets.only(right: 16, bottom: 10),
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                child: Container(
                  height: 160,
                  width: double.infinity,
                  color: Theme.of(context).colorScheme.onSurface.withOpacity(0.1),
                  child: _buildImage(context),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(12.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.book['title'] ?? 'Unknown',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Theme.of(context).colorScheme.onSurface),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      widget.book['author'] ?? 'Unknown',
                      style: TextStyle(fontSize: 12, color: Theme.of(context).textTheme.bodyMedium?.color),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildImage(BuildContext context) {
    if (widget.book['cover_image_url'] != null && widget.book['cover_image_url'].toString().isNotEmpty) {
      return Image.network(widget.book['cover_image_url'], fit: BoxFit.cover, errorBuilder: (_, __, ___) => Icon(Icons.book, size: 40, color: Theme.of(context).textTheme.bodyMedium?.color));
    }
    if (widget.book['cover_image_path'] != null && widget.book['cover_image_path'].toString().isNotEmpty) {
      return Image.network(widget.book['cover_image_path'], fit: BoxFit.cover, errorBuilder: (_, __, ___) => Icon(Icons.book, size: 40, color: Theme.of(context).textTheme.bodyMedium?.color));
    }
    return Icon(Icons.book, size: 40, color: Theme.of(context).textTheme.bodyMedium?.color);
  }
}
