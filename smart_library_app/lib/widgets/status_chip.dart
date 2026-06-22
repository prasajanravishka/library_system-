import 'package:flutter/material.dart';
import '../core/app_theme.dart';

/// Status indicator chip with color-coded backgrounds.
/// - Available → Emerald
/// - Borrowed → Emerald
/// - Overdue → Red
/// - Pending → Amber
/// - Returned → Grey
class StatusChip extends StatelessWidget {
  final String status;

  const StatusChip({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final chipData = _getChipData(status);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: chipData.color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: chipData.color.withValues(alpha: 0.4),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: chipData.color,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            chipData.label,
            style: TextStyle(
              color: chipData.color,
              fontSize: 11,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }

  _ChipData _getChipData(String status) {
    switch (status.toLowerCase()) {
      case 'available':
        return _ChipData(AppColors.emerald, 'Available');
      case 'borrowed':
        return _ChipData(AppColors.emerald, 'Borrowed');
      case 'overdue':
        return _ChipData(AppColors.red, 'Overdue');
      case 'pending':
        return _ChipData(AppColors.amber, 'Pending');
      case 'returned':
        return _ChipData(Colors.grey, 'Returned');
      case 'lost':
        return _ChipData(AppColors.red, 'Lost');
      default:
        return _ChipData(Colors.grey, status);
    }
  }
}

class _ChipData {
  final Color color;
  final String label;
  const _ChipData(this.color, this.label);
}
