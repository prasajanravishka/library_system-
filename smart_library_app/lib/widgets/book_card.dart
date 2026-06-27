import 'package:flutter/material.dart';
import '../core/app_theme.dart';
import 'status_chip.dart';
import 'glass_card.dart';

/// Reusable book card for library and search result lists.
/// Shows book cover placeholder, title, author, and status chip.
class BookCard extends StatelessWidget {
  final String title;
  final String author;
  final String status;
  final String? borrowDate;
  final String? dueDate;
  final int? daysLeft;
  final String? coverImageUrl;
  final VoidCallback? onTap;

  const BookCard({
    super.key,
    required this.title,
    required this.author,
    required this.status,
    this.borrowDate,
    this.dueDate,
    this.daysLeft,
    this.coverImageUrl,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final bool isOverdue = (daysLeft != null && daysLeft! < 0) || status == 'overdue';
    final Color borderHighlight = isOverdue
        ? AppColors.red.withValues(alpha: 0.4)
        : AppColors.borderSubtle;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: GlassCard(
        borderColor: borderHighlight,
        enableBlur: false,
        boxShadow: isOverdue
            ? [
                BoxShadow(
                  color: AppColors.red.withValues(alpha: 0.08),
                  blurRadius: 12,
                  spreadRadius: 1,
                ),
              ]
            : null,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Book cover placeholder
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: coverImageUrl != null && coverImageUrl!.isNotEmpty
                      ? Image.network(
                          coverImageUrl!,
                          height: 80,
                          width: 58,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => _buildPlaceholder(),
                        )
                      : _buildPlaceholder(),
                  ),
                  const SizedBox(width: 14),
                  // Book info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: AppTextStyles.heading3.copyWith(fontSize: 16),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          author,
                          style: AppTextStyles.bodyMedium,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (borrowDate != null || dueDate != null) ...[
                          const SizedBox(height: 10),
                          Wrap(
                            crossAxisAlignment: WrapCrossAlignment.center,
                            children: [
                              if (borrowDate != null) ...[
                                Icon(Icons.calendar_today_rounded,
                                    size: 12, color: AppColors.textSecondary),
                                const SizedBox(width: 4),
                                Text(
                                  borrowDate!,
                                  style: AppTextStyles.bodySmall,
                                ),
                                const SizedBox(width: 12),
                              ],
                              if (dueDate != null) ...[
                                Icon(Icons.event_rounded,
                                    size: 12,
                                    color: isOverdue ? AppColors.red : AppColors.cyan),
                                const SizedBox(width: 4),
                                Text(
                                  dueDate!,
                                  style: AppTextStyles.bodySmall.copyWith(
                                    color: isOverdue ? AppColors.red : AppColors.cyan,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  // Status chip
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      StatusChip(
                        status: isOverdue ? 'overdue' : status,
                      ),
                      if (daysLeft != null && !isOverdue && status == 'borrowed') ...[
                        const SizedBox(height: 8),
                        Text(
                          '$daysLeft days',
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.cyan,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPlaceholder() {
    return Container(
      height: 80,
      width: 58,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.purple.withValues(alpha: 0.3),
            AppColors.cyan.withValues(alpha: 0.15),
          ],
        ),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: AppColors.purple.withValues(alpha: 0.2),
        ),
      ),
      child: const Icon(
        Icons.auto_stories_rounded,
        color: AppColors.purple,
        size: 28,
      ),
    );
  }
}
