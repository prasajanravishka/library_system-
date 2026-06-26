import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import '../core/app_theme.dart';
import '../widgets/glass_card.dart';

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  final _subjectController = TextEditingController();
  final _messageController = TextEditingController();

  void _submitTicket() {
    if (_subjectController.text.isEmpty || _messageController.text.isEmpty) return;

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Support ticket submitted successfully!'), backgroundColor: AppColors.cyan),
    );
    _subjectController.clear();
    _messageController.clear();
  }

  @override
  void dispose() {
    _subjectController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: FadeInDown(child: Text('Help & Support', style: AppTextStyles.heading2)),
        centerTitle: true,
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
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        labelText: 'Subject',
                        labelStyle: const TextStyle(color: Colors.white70),
                        enabledBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Colors.white24)),
                        focusedBorder: const UnderlineInputBorder(borderSide: BorderSide(color: AppColors.cyan)),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _messageController,
                      style: const TextStyle(color: Colors.white),
                      maxLines: 4,
                      decoration: InputDecoration(
                        labelText: 'Message',
                        labelStyle: const TextStyle(color: Colors.white70),
                        enabledBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Colors.white24)),
                        focusedBorder: const UnderlineInputBorder(borderSide: BorderSide(color: AppColors.cyan)),
                      ),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        onPressed: _submitTicket,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.cyan,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text('Submit Ticket', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    )
                  ],
                ),
              ),
            ),
            const SizedBox(height: 30),
            FadeInUp(
              delay: const Duration(milliseconds: 200),
              child: Text('Frequently Asked Questions', style: AppTextStyles.heading3),
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
          collapsedIconColor: Colors.white,
          iconColor: AppColors.cyan,
          title: Text(question, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Text(answer, style: const TextStyle(color: Colors.white70)),
            )
          ],
        ),
      ),
    );
  }
}
