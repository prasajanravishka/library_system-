import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/app_theme.dart';
import '../providers/providers.dart';
import '../widgets/interactive_cards.dart';

class AllFeaturedBooksScreen extends ConsumerWidget {
  const AllFeaturedBooksScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final featuredAsync = ref.watch(featuredBooksProvider);

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('Featured Books'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: featuredAsync.when(
        data: (books) {
          if (books.isEmpty) {
            return Center(child: Text('No featured books found', style: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color)));
          }
          return GridView.builder(
            padding: const EdgeInsets.all(20),
            physics: const BouncingScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              childAspectRatio: 0.65,
            ),
            itemCount: books.length,
            itemBuilder: (context, index) {
              return BookInteractiveCard(book: books[index]);
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.cyan)),
        error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppColors.red))),
      ),
    );
  }
}
