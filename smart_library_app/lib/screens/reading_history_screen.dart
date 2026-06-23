import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import '../core/app_theme.dart';
import '../widgets/glass_card.dart';

class ReadingHistoryScreen extends StatelessWidget {
  const ReadingHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // Mock history data for UI demonstration
    final List<Map<String, dynamic>> history = [
      {'title': 'The Great Gatsby', 'author': 'F. Scott Fitzgerald', 'date': '2026-05-10', 'status': 'returned'},
      {'title': '1984', 'author': 'George Orwell', 'date': '2026-06-01', 'status': 'overdue'},
      {'title': 'Dune', 'author': 'Frank Herbert', 'date': '2026-06-15', 'status': 'borrowed'},
    ];

    return Scaffold(
      backgroundColor: AppColors.primaryBg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: FadeInDown(child: Text('Reading History', style: AppTextStyles.heading2)),
        centerTitle: true,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(20),
        itemCount: history.length,
        itemBuilder: (context, index) {
          final item = history[index];
          final isOverdue = item['status'] == 'overdue';
          final isReturned = item['status'] == 'returned';

          return FadeInUp(
            delay: Duration(milliseconds: 100 * index),
            child: Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: GlassCard(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      width: 60,
                      height: 80,
                      decoration: BoxDecoration(
                        color: Colors.white24,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.book, color: Colors.white70, size: 30),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(item['title'], style: AppTextStyles.heading3),
                          const SizedBox(height: 4),
                          Text(item['author'], style: const TextStyle(color: Colors.white70)),
                          const SizedBox(height: 8),
                          Text('Borrowed: ${item['date']}', style: const TextStyle(color: Colors.white54, fontSize: 12)),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: isOverdue ? AppColors.red.withOpacity(0.2) : (isReturned ? Colors.green.withOpacity(0.2) : AppColors.cyan.withOpacity(0.2)),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: isOverdue ? AppColors.red : (isReturned ? Colors.green : AppColors.cyan)),
                      ),
                      child: Text(
                        item['status'].toString().toUpperCase(),
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: isOverdue ? AppColors.red : (isReturned ? Colors.green : AppColors.cyan),
                        ),
                      ),
                    )
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
