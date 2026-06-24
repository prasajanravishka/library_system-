import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:animate_do/animate_do.dart';
import '../core/app_theme.dart';
import '../providers/providers.dart';
import '../widgets/glass_card.dart';

/// Book confirmation form — pre-filled with AI-extracted data.
/// Allows manual correction of OCR results before confirming.
class BookDetailsConfirmationScreen extends ConsumerStatefulWidget {
  final String title;
  final String author;
  final String coverImagePath;
  final String rawText;

  const BookDetailsConfirmationScreen({
    super.key,
    required this.title,
    required this.author,
    required this.coverImagePath,
    required this.rawText,
  });

  @override
  ConsumerState<BookDetailsConfirmationScreen> createState() =>
      _BookDetailsConfirmationScreenState();
}

class _BookDetailsConfirmationScreenState
    extends ConsumerState<BookDetailsConfirmationScreen> {
  late final TextEditingController _titleController;
  late final TextEditingController _authorController;
  late final TextEditingController _isbnController;
  bool _isSubmitting = false;
  bool _submitted = false;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.title);
    _authorController = TextEditingController(text: widget.author);
    _isbnController = TextEditingController();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _authorController.dispose();
    _isbnController.dispose();
    super.dispose();
  }

  Future<void> _confirmAndAdd() async {
    final title = _titleController.text.trim();
    final author = _authorController.text.trim();

    if (title.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Title is required'),
          backgroundColor: AppColors.red,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final apiService = ref.read(apiServiceProvider);
      final response = await apiService.addBook(
        title: title,
        author: author,
        isbn: _isbnController.text.trim(),
        coverImagePath: widget.coverImagePath,
      );

      if (!mounted) return;

      if (response['status'] == 'success') {
        setState(() => _submitted = true);
        // Invalidate providers to refresh data
        ref.invalidate(dashboardStatsProvider);
        ref.invalidate(allBooksProvider);

        // Show success for a moment then pop
        await Future.delayed(const Duration(seconds: 2));
        if (mounted) {
          Navigator.of(context).popUntil((route) => route.isFirst);
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to add book'),
            backgroundColor: AppColors.red,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString().replaceFirst("Exception: ", "")}'),
            backgroundColor: AppColors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_submitted) {
      return _buildSuccessState();
    }

    return Scaffold(
      
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        title: Text('Confirm Details', style: AppTextStyles.heading3),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Book cover placeholder
            FadeInDown(
              child: GlassCard(
                enableBlur: false,
                padding: const EdgeInsets.all(32),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            AppColors.cyan.withValues(alpha: 0.15),
                            Colors.transparent,
                          ],
                        ),
                      ),
                      child: const Icon(
                        Icons.auto_stories_rounded,
                        size: 56,
                        color: AppColors.cyan,
                      ),
                    ),
                    if (widget.rawText.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.emerald.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.auto_fix_high_rounded,
                                size: 14, color: AppColors.emerald),
                            const SizedBox(width: 6),
                            Text(
                              'AI Extracted',
                              style: TextStyle(
                                color: AppColors.emerald,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Title field
            FadeInUp(
              delay: const Duration(milliseconds: 100),
              child: _buildLabeledField(
                label: 'Title',
                controller: _titleController,
                icon: Icons.title_rounded,
                isAiExtracted: widget.title.isNotEmpty,
              ),
            ),
            const SizedBox(height: 16),

            // Author field
            FadeInUp(
              delay: const Duration(milliseconds: 200),
              child: _buildLabeledField(
                label: 'Author',
                controller: _authorController,
                icon: Icons.person_outline_rounded,
                isAiExtracted: widget.author.isNotEmpty,
              ),
            ),
            const SizedBox(height: 16),

            // ISBN field
            FadeInUp(
              delay: const Duration(milliseconds: 300),
              child: _buildLabeledField(
                label: 'ISBN (Optional)',
                controller: _isbnController,
                icon: Icons.qr_code_rounded,
                isAiExtracted: false,
              ),
            ),
            const SizedBox(height: 32),

            // Confirm & Add button
            FadeInUp(
              delay: const Duration(milliseconds: 400),
              child: Container(
                height: 56,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(14),
                  gradient: const LinearGradient(
                    colors: [AppColors.cyan, Color(0xFF0891B2)],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.cyan.withValues(alpha: 0.3),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: ElevatedButton.icon(
                  onPressed: _isSubmitting ? null : _confirmAndAdd,
                  icon: _isSubmitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Icon(Icons.check_circle_outline_rounded,
                          color: Colors.white),
                  label: Text(
                    _isSubmitting ? 'Adding...' : 'Confirm & Add',
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
                    shadowColor: Colors.transparent,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                ),
              ),
            ),

            if (widget.rawText.isNotEmpty) ...[
              const SizedBox(height: 24),
              // Raw OCR text collapsible
              FadeInUp(
                delay: const Duration(milliseconds: 500),
                child: ExpansionTile(
                  tilePadding: EdgeInsets.zero,
                  title: Text(
                    'View Raw OCR Text',
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                  iconColor: AppColors.textSecondary,
                  collapsedIconColor: AppColors.textSecondary,
                  children: [
                    GlassCard(
                      enableBlur: false,
                      padding: const EdgeInsets.all(14),
                      child: Text(
                        widget.rawText,
                        style: AppTextStyles.bodySmall.copyWith(
                          fontFamily: 'monospace',
                          height: 1.5,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildLabeledField({
    required String label,
    required TextEditingController controller,
    required IconData icon,
    required bool isAiExtracted,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(label, style: AppTextStyles.bodyMedium),
            if (isAiExtracted) ...[
              const SizedBox(width: 8),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.purple.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  'AI',
                  style: TextStyle(
                    color: AppColors.purple,
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          style: const TextStyle(color: Colors.white, fontSize: 16),
          decoration: InputDecoration(
            prefixIcon: Icon(icon),
          ),
        ),
      ],
    );
  }

  Widget _buildSuccessState() {
    return Scaffold(
      
      body: Center(
        child: FadeIn(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              ZoomIn(
                child: Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.emerald.withValues(alpha: 0.12),
                    border: Border.all(
                      color: AppColors.emerald.withValues(alpha: 0.3),
                      width: 2,
                    ),
                  ),
                  child: const Icon(
                    Icons.check_rounded,
                    size: 56,
                    color: AppColors.emerald,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text('Book Added!', style: AppTextStyles.heading1),
              const SizedBox(height: 8),
              Text(
                'Successfully added to the library catalog.',
                style: AppTextStyles.bodyMedium,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
