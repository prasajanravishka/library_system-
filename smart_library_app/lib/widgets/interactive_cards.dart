import 'package:flutter/material.dart';
import '../core/app_theme.dart';
import '../models/category_model.dart';
import '../screens/book_detail_screen.dart';

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
