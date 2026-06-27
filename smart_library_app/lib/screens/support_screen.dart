import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:animate_do/animate_do.dart';
import '../core/app_theme.dart';
import '../widgets/glass_card.dart';
import '../providers/providers.dart';

class SupportScreen extends ConsumerStatefulWidget {
  const SupportScreen({super.key});

  @override
  ConsumerState<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends ConsumerState<SupportScreen> {
  final _subjectController = TextEditingController();
  final _messageController = TextEditingController();
  bool _isSubmitting = false;

  void _submitTicket() async {
    if (_subjectController.text.isEmpty || _messageController.text.isEmpty) return;

    setState(() => _isSubmitting = true);
    
    try {
      final userId = ref.read(authProvider).userId;
      final apiService = ref.read(apiServiceProvider);
      
      await apiService.createSupportTicket(userId, _subjectController.text, _messageController.text);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Support ticket submitted successfully!'), backgroundColor: AppColors.cyan),
        );
        _subjectController.clear();
        _messageController.clear();
        ref.invalidate(supportTicketsProvider(userId));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error submitting ticket: $e'), backgroundColor: AppColors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  void dispose() {
    _subjectController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final userId = ref.watch(authProvider).userId;
    final ticketsAsync = ref.watch(supportTicketsProvider(userId));

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: FadeInDown(child: Text('Help & Support', style: AppTextStyles.heading2.copyWith(color: AppColors.lightTextPrimary))),
        centerTitle: true,
        iconTheme: const IconThemeData(color: AppColors.lightTextPrimary),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 600),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                FadeInUp(
                  delay: const Duration(milliseconds: 100),
                  child: GlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Contact Support', style: AppTextStyles.heading3),
                        const SizedBox(height: 16),
                        TextField(
                          controller: _subjectController,
                          decoration: const InputDecoration(
                            labelText: 'Subject',
                          ),
                        ),
                        const SizedBox(height: 16),
                        TextField(
                          controller: _messageController,
                          maxLines: 4,
                          decoration: const InputDecoration(
                            labelText: 'Message',
                          ),
                        ),
                        const SizedBox(height: 20),
                        SizedBox(
                          width: double.infinity,
                          height: 48,
                          child: ElevatedButton(
                            onPressed: _isSubmitting ? null : _submitTicket,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.cyan,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: _isSubmitting 
                                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white))
                                : const Text('Submit Ticket', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                          ),
                        )
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 30),
                FadeInUp(
                  delay: const Duration(milliseconds: 150),
                  child: Text('Your Tickets', style: AppTextStyles.heading3.copyWith(color: AppColors.lightTextPrimary)),
                ),
                const SizedBox(height: 10),
                ticketsAsync.when(
                  loading: () => const Center(child: CircularProgressIndicator(color: AppColors.cyan)),
                  error: (e, _) => Center(child: Text('Error loading tickets: $e')),
                  data: (tickets) {
                    if (tickets.isEmpty) {
                      return Center(child: Text('No support tickets found', style: TextStyle(color: AppColors.lightTextSecondary)));
                    }
                    return ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: tickets.length,
                      itemBuilder: (context, index) {
                        final ticket = tickets[index];
                        final isResolved = ticket['status'] == 'resolved';
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 8.0),
                          child: GlassCard(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(child: Text(ticket['subject'] ?? '', style: AppTextStyles.heading3.copyWith(fontSize: 16))),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: isResolved ? Colors.green.withValues(alpha: 0.1) : AppColors.amber.withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(color: isResolved ? Colors.green : AppColors.amber),
                                      ),
                                      child: Text(
                                        ticket['status']?.toUpperCase() ?? 'OPEN',
                                        style: TextStyle(
                                          fontSize: 10,
                                          color: isResolved ? Colors.green : AppColors.amber,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text(ticket['message'] ?? '', style: TextStyle(color: AppColors.lightTextSecondary, fontSize: 14)),
                                const SizedBox(height: 8),
                                Text(ticket['created_at'] ?? '', style: TextStyle(color: AppColors.lightTextSecondary.withValues(alpha: 0.6), fontSize: 12)),
                              ],
                            ),
                          ),
                        );
                      },
                    );
                  }
                ),
                const SizedBox(height: 30),
                FadeInUp(
                  delay: const Duration(milliseconds: 200),
                  child: Text('Frequently Asked Questions', style: AppTextStyles.heading3.copyWith(color: AppColors.lightTextPrimary)),
                ),
                const SizedBox(height: 10),
                FadeInUp(
                  delay: const Duration(milliseconds: 300),
                  child: _buildFaqItem('How do I scan a book?', 'Tap the scanner icon on the dashboard and point your camera at the book cover. Our AI will automatically extract the details.'),
                ),
                FadeInUp(
                  delay: const Duration(milliseconds: 400),
                  child: _buildFaqItem('How do I pay a fine?', 'Pending fines will appear on your profile. You can tap the "Pay" button next to the fine amount.'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFaqItem(String question, String answer) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: GlassCard(
        padding: const EdgeInsets.all(0),
        child: ExpansionTile(
          collapsedIconColor: AppColors.lightTextPrimary,
          iconColor: AppColors.cyan,
          title: Text(question, style: const TextStyle(fontWeight: FontWeight.bold)),
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Text(answer, style: TextStyle(color: AppColors.lightTextSecondary)),
            )
          ],
        ),
      ),
    );
  }
}
