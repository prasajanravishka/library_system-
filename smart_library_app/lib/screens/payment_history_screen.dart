import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:animate_do/animate_do.dart';
import '../core/app_theme.dart';
import '../providers/providers.dart';

class PaymentHistoryScreen extends ConsumerStatefulWidget {
  const PaymentHistoryScreen({super.key});

  @override
  ConsumerState<PaymentHistoryScreen> createState() => _PaymentHistoryScreenState();
}

class _PaymentHistoryScreenState extends ConsumerState<PaymentHistoryScreen> {
  String _selectedFilter = 'all';

  @override
  Widget build(BuildContext context) {
    final paymentHistoryAsync = ref.watch(paymentHistoryProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: FadeInDown(
          duration: const Duration(milliseconds: 400),
          child: Text('Payment History', style: AppTextStyles.heading2),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Filter chips selection row
            _buildFilterChips(isDark),
            
            // Payments list
            Expanded(
              child: paymentHistoryAsync.when(
                data: (payments) {
                  final filteredPayments = payments.where((p) {
                    if (_selectedFilter == 'all') return true;
                    return (p['status'] ?? 'pending').toString().toLowerCase() == _selectedFilter;
                  }).toList();

                  if (filteredPayments.isEmpty) {
                    return Center(
                      child: FadeInUp(
                        duration: const Duration(milliseconds: 400),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.receipt_long_rounded,
                              size: 64,
                              color: Colors.grey.withValues(alpha: 0.4),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'No ${_selectedFilter == 'all' ? '' : '$_selectedFilter '}payments found',
                              style: AppTextStyles.heading3.copyWith(
                                color: isDark ? Colors.white60 : Colors.black54,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              _selectedFilter == 'all'
                                  ? 'Any receipt uploads will be listed here.'
                                  : 'No payment slips currently match this status.',
                              style: const TextStyle(color: Colors.grey),
                            ),
                          ],
                        ),
                      ),
                    );
                  }

                  return RefreshIndicator(
                    onRefresh: () async {
                      ref.invalidate(paymentHistoryProvider);
                    },
                    color: AppColors.cyan,
                    child: ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                      itemCount: filteredPayments.length,
                      itemBuilder: (context, index) {
                        final p = filteredPayments[index];
                        final title = p['book_title'] ?? 'Overdue Fine';
                        final amount = p['amount_paid']?.toString() ?? '0.00';
                        final status = p['status'] ?? 'pending';
                        final refCode = p['transaction_reference'] ?? 'TXN-UNKNOWN';
                        final rawDate = p['paid_at'] ?? '';
                        
                        String formattedDate = '';
                        try {
                          if (rawDate.isNotEmpty) {
                            final dt = DateTime.parse(rawDate);
                            formattedDate = '${dt.day}/${dt.month}/${dt.year}';
                          }
                        } catch (_) {}

                        return FadeInUp(
                          duration: const Duration(milliseconds: 300),
                          delay: Duration(milliseconds: index * 50),
                          child: Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: _getStatusColor(status).withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Icon(
                                      _getStatusIcon(status),
                                      color: _getStatusColor(status),
                                      size: 24,
                                    ),
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          title,
                                          style: AppTextStyles.bodyLarge.copyWith(
                                            fontWeight: FontWeight.bold,
                                            color: isDark ? Colors.white : Colors.black87,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: 6),
                                        Text(
                                          'Ref: $refCode',
                                          style: TextStyle(
                                            color: Colors.grey.shade500,
                                            fontSize: 12,
                                            fontFamily: 'monospace',
                                          ),
                                        ),
                                        if (formattedDate.isNotEmpty) ...[
                                          const SizedBox(height: 4),
                                          Text(
                                            'Submitted on: $formattedDate',
                                            style: TextStyle(
                                              color: Colors.grey.shade500,
                                              fontSize: 12,
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(
                                        '\$$amount',
                                        style: AppTextStyles.bodyLarge.copyWith(
                                          fontWeight: FontWeight.bold,
                                          color: _getStatusColor(status),
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      _buildStatusBadge(status),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  );
                },
                loading: () => const Center(
                  child: CircularProgressIndicator(color: AppColors.cyan),
                ),
                error: (err, _) => Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline_rounded, color: AppColors.red, size: 48),
                      const SizedBox(height: 12),
                      Text('Failed to load history', style: AppTextStyles.heading3),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () => ref.invalidate(paymentHistoryProvider),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChips(bool isDark) {
    final filters = [
      {'id': 'all', 'label': 'All'},
      {'id': 'pending', 'label': 'Pending'},
      {'id': 'approved', 'label': 'Approved'},
      {'id': 'rejected', 'label': 'Rejected'},
    ];

    return Container(
      height: 40,
      margin: const EdgeInsets.only(top: 8, bottom: 12),
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        scrollDirection: Axis.horizontal,
        itemCount: filters.length,
        separatorBuilder: (context, index) => const SizedBox(width: 10),
        itemBuilder: (context, index) {
          final f = filters[index];
          final isSelected = _selectedFilter == f['id'];
          final id = f['id']!;

          Color activeColor = AppColors.cyan;
          if (id == 'approved') activeColor = AppColors.emerald;
          if (id == 'rejected') activeColor = AppColors.red;
          if (id == 'pending') activeColor = AppColors.amber;

          return ChoiceChip(
            label: Text(
              f['label']!,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: isSelected ? Colors.white : (isDark ? Colors.white60 : Colors.black87),
              ),
            ),
            selected: isSelected,
            showCheckmark: false,
            onSelected: (selected) {
              if (selected) {
                setState(() {
                  _selectedFilter = id;
                });
              }
            },
            selectedColor: activeColor,
            backgroundColor: isDark ? Colors.grey.shade900 : Colors.grey.shade100,
            checkmarkColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
              side: BorderSide(
                color: isSelected ? activeColor : (isDark ? Colors.white10 : Colors.grey.shade300),
              ),
            ),
          );
        },
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'approved':
        return AppColors.emerald;
      case 'rejected':
        return AppColors.red;
      default:
        return AppColors.amber;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'approved':
        return Icons.check_circle_outline_rounded;
      case 'rejected':
        return Icons.error_outline_rounded;
      default:
        return Icons.pending_actions_rounded;
    }
  }

  Widget _buildStatusBadge(String status) {
    final color = _getStatusColor(status);
    final text = status.toUpperCase();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.3), width: 1),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
