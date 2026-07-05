import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:animate_do/animate_do.dart';
import '../core/app_theme.dart';
import '../providers/providers.dart';
import '../widgets/glass_card.dart';
import 'book_detail_screen.dart';
import 'search_results_screen.dart';

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

  String _availabilityStatus = 'Checking...';
  bool _isAvailable = false;
  int? _matchedBookId;
  bool _isChecking = false;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.title);
    _authorController = TextEditingController(text: widget.author);
    _isbnController = TextEditingController();
    
    // Check database availability on open
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkAvailability();
    });
  }

  Future<void> _checkAvailability() async {
    final title = _titleController.text.trim();
    if (title.isEmpty) {
      setState(() {
        _availabilityStatus = 'No title to search';
        _isAvailable = false;
        _matchedBookId = null;
      });
      return;
    }

    setState(() {
      _isChecking = true;
      _availabilityStatus = 'Checking availability...';
    });

    try {
      final apiService = ref.read(apiServiceProvider);
      final response = await apiService.searchBooks(title);
      final List<dynamic> books = response['books'] ?? [];

      if (books.isEmpty) {
        setState(() {
          _availabilityStatus = 'Not Available in Library Catalog';
          _isAvailable = false;
          _matchedBookId = null;
        });
      } else {
        // Try exact title match or fall back to first result
        var matched = books.firstWhere(
          (b) => b['title']?.toString().toLowerCase().trim() == title.toLowerCase().trim(),
          orElse: () => books.first,
        );

        final copies = matched['available_copies'] ?? 0;
        final isBookAvail = matched['availability_status'] == 'available' && copies > 0;

        setState(() {
          _matchedBookId = matched['book_id'] is String
              ? int.parse(matched['book_id'])
              : matched['book_id'] as int;
          _isAvailable = isBookAvail;
          _availabilityStatus = isBookAvail
              ? '🟢 Available ($copies copies on shelf)'
              : '🟡 Out of Stock (All copies borrowed)';
        });
      }
    } catch (e) {
      setState(() {
        _availabilityStatus = 'Error checking availability';
        _isAvailable = false;
        _matchedBookId = null;
      });
    } finally {
      setState(() {
        _isChecking = false;
      });
    }
  }

  void _confirmSearch() {
    if (_matchedBookId != null) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => BookDetailScreen(bookId: _matchedBookId!),
        ),
      );
    } else {
      // If book not found in library, open SearchResultsScreen with the title
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => SearchResultsScreen(initialQuery: _titleController.text),
        ),
      );
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _authorController.dispose();
    _isbnController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
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
            const SizedBox(height: 24),

            // Availability status card
            FadeInUp(
              delay: const Duration(milliseconds: 350),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Availability Status', style: AppTextStyles.bodyMedium),
                  const SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.glassSurface,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.borderSubtle),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          _matchedBookId != null
                              ? (_isAvailable ? Icons.check_circle_outline_rounded : Icons.info_outline_rounded)
                              : Icons.help_outline_rounded,
                          color: _matchedBookId != null
                              ? (_isAvailable ? AppColors.emerald : AppColors.amber)
                              : AppColors.textSecondary,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            _availabilityStatus,
                            style: AppTextStyles.bodyMedium.copyWith(
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        if (_isChecking)
                          const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppColors.cyan,
                            ),
                          )
                        else
                          IconButton(
                            icon: const Icon(Icons.refresh_rounded, size: 20, color: AppColors.cyan),
                            onPressed: _checkAvailability,
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),

            // Confirm & Search button
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
                  onPressed: _confirmSearch,
                  icon: const Icon(Icons.search_rounded, color: Colors.white),
                  label: Text(
                    _matchedBookId != null ? 'View Book Details' : 'Search in Catalog',
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
}
