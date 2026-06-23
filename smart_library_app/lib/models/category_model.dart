import 'package:flutter/material.dart';

class CategoryModel {
  final int id;
  final String name;
  final String? description;
  final String icon;
  final int sortOrder;
  final int bookCount;

  const CategoryModel({
    required this.id,
    required this.name,
    this.description,
    required this.icon,
    this.sortOrder = 0,
    this.bookCount = 0,
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    return CategoryModel(
      id: json['category_id'] ?? json['id'] ?? 0,
      name: json['name'] ?? 'Unknown',
      description: json['description'],
      icon: json['icon'] ?? 'category',
      sortOrder: json['sort_order'] ?? 0,
      bookCount: json['book_count'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'category_id': id,
      'name': name,
      'description': description,
      'icon': icon,
      'sort_order': sortOrder,
      'book_count': bookCount,
    };
  }

  /// Helper to convert the string icon name from DB to a Material IconData
  IconData get iconData {
    switch (icon) {
      case 'computer':
        return Icons.computer_rounded;
      case 'auto_stories':
        return Icons.auto_stories_rounded;
      case 'science':
        return Icons.science_rounded;
      case 'history':
        return Icons.history_edu_rounded;
      case 'palette':
        return Icons.palette_rounded;
      case 'calculate':
        return Icons.calculate_rounded;
      case 'psychology':
        return Icons.psychology_rounded;
      case 'menu_book':
        return Icons.menu_book_rounded;
      default:
        return Icons.category_rounded;
    }
  }
}
