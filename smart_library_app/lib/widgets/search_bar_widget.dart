import 'package:flutter/material.dart';
import '../core/app_theme.dart';
import 'glass_card.dart';

/// A pinned search bar widget for the dashboard.
/// Glass surface with cyan search icon and rounded corners.
class SearchBarWidget extends StatelessWidget {
  final VoidCallback? onTap;
  final String hintText;

  const SearchBarWidget({
    super.key,
    this.onTap,
    this.hintText = 'Search Library...',
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: GlassCard(
        enableBlur: false,
        borderRadius: 14,
        borderColor: AppColors.cyan.withValues(alpha: 0.2),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Icon(
              Icons.search_rounded,
              color: AppColors.cyan,
              size: 22,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                hintText,
                style: AppTextStyles.bodyMedium.copyWith(
                  color: (Theme.of(context).textTheme.bodyMedium?.color ?? Colors.grey).withValues(alpha: 0.6),
                ),
              ),
            ),
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppColors.cyan.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                Icons.tune_rounded,
                color: AppColors.cyan,
                size: 18,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
