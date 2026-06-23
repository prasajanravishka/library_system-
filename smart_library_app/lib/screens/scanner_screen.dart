import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:animate_do/animate_do.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shimmer/shimmer.dart';
import '../core/app_theme.dart';
import '../providers/providers.dart';

import 'book_details_confirmation_screen.dart';

/// Scanner screen — capture or pick an image, send to OCR backend,
/// show shimmer loading, and navigate to confirmation form.
class ScannerScreen extends ConsumerStatefulWidget {
  const ScannerScreen({super.key});

  @override
  ConsumerState<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends ConsumerState<ScannerScreen>
    with SingleTickerProviderStateMixin {
  final ImagePicker _picker = ImagePicker();
  bool _isProcessing = false;
  late AnimationController _reticleController;

  @override
  void initState() {
    super.initState();
    _reticleController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _reticleController.dispose();
    super.dispose();
  }

  Future<void> _captureFromCamera() async {
    final image = await _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 85,
      maxWidth: 1920,
    );
    if (image != null) {
      _processImage(image);
    }
  }

  Future<void> _pickFromGallery() async {
    final image = await _picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
      maxWidth: 1920,
    );
    if (image != null) {
      _processImage(image);
    }
  }

  Future<void> _processImage(XFile image) async {
    setState(() {
      _isProcessing = true;
    });

    try {
      final apiService = ref.read(apiServiceProvider);
      final response = await apiService.extractBookInfo(image.path);

      if (!mounted) return;

      if (response['status'] == 'success') {
        final bookInfo = response['book_info'] as Map<String, dynamic>;
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => BookDetailsConfirmationScreen(
              title: bookInfo['title'] ?? '',
              author: bookInfo['author'] ?? '',
              coverImagePath: bookInfo['cover_image_path'] ?? '',
              rawText: response['raw_text'] ?? '',
            ),
          ),
        );
      } else {
        _showError('Failed to process image');
      }
    } catch (e) {
      if (mounted) {
        final errorMessage = e.toString().replaceFirst("Exception: ", "");
        // Show more detailed error dialog for connection issues
        if (errorMessage.contains('Connection') ||
            errorMessage.contains('Network') ||
            errorMessage.contains('timeout')) {
          _showConnectionErrorDialog(errorMessage);
        } else {
          _showError(errorMessage);
        }
      }
    } finally {
      if (mounted) {
        setState(() => _isProcessing = false);
      }
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: AppColors.red,
        duration: const Duration(seconds: 5),
      ),
    );
  }

  void _showConnectionErrorDialog(String errorMessage) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Connection Error'),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                errorMessage,
                style: const TextStyle(
                  color: AppColors.red,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Troubleshooting tips:',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text('• Ensure the backend server is running on port 8001'),
              const SizedBox(height: 8),
              const Text(
                '• For Android Emulator: Backend should be accessible at http://10.0.2.2:8001',
              ),
              const SizedBox(height: 8),
              const Text(
                '• For iOS Simulator: Backend should be accessible at http://127.0.0.1:8001',
              ),
              const SizedBox(height: 8),
              const Text(
                '• For Physical Device: Update IP address in AppConstants (currently: 192.168.1.100:8001)',
              ),
              const SizedBox(height: 8),
              const Text('• Check your network connection'),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _navigateToManualEntry();
            },
            child: const Text('Manual Entry'),
          ),
        ],
      ),
    );
  }

  void _navigateToManualEntry() {
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (_) => const BookDetailsConfirmationScreen(
          title: '',
          author: '',
          coverImagePath: '',
          rawText: '',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.primaryBg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        title: Text('Scan Book', style: AppTextStyles.heading3),
        centerTitle: true,
      ),
      body: _isProcessing ? _buildProcessingState() : _buildScannerUI(),
    );
  }

  /// ── Scanner UI ─────────────────────────────────────────────────────────
  Widget _buildScannerUI() {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const Spacer(),

            // Viewfinder reticle area
            FadeInDown(
              child: Container(
                width: 260,
                height: 340,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: AppColors.cyan.withValues(alpha: 0.5),
                    width: 2,
                  ),
                ),
                child: Stack(
                  children: [
                    // Corner brackets
                    ..._buildCornerBrackets(),

                    // Animated scan line
                    AnimatedBuilder(
                      animation: _reticleController,
                      builder: (context, child) {
                        return Positioned(
                          top: 20 + (_reticleController.value * 296),
                          left: 20,
                          right: 20,
                          child: Container(
                            height: 3,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  Colors.transparent,
                                  AppColors.purple,
                                  Colors.transparent,
                                ],
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.purple.withValues(
                                    alpha: 0.6,
                                  ),
                                  blurRadius: 12,
                                  spreadRadius: 2,
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),

                    // Center icon
                    Center(
                      child: Icon(
                        Icons.auto_stories_rounded,
                        size: 64,
                        color: AppColors.textSecondary.withValues(alpha: 0.2),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Position book cover within the frame',
              style: AppTextStyles.bodyMedium,
            ),

            const Spacer(),

            // Camera capture button
            FadeInUp(
              delay: const Duration(milliseconds: 200),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Gallery pick
                  GestureDetector(
                    onTap: _pickFromGallery,
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.glassSurface,
                        border: Border.all(color: AppColors.borderSubtle),
                      ),
                      child: const Icon(
                        Icons.photo_library_rounded,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                  ),
                  const SizedBox(width: 28),

                  // Shutter button
                  GestureDetector(
                    onTap: _captureFromCamera,
                    child: Container(
                      width: 76,
                      height: 76,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 4),
                      ),
                      child: Container(
                        margin: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 28),

                  // Flashlight toggle placeholder
                  GestureDetector(
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Flashlight toggled'),
                          duration: Duration(seconds: 1),
                        ),
                      );
                    },
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.glassSurface,
                        border: Border.all(color: AppColors.borderSubtle),
                      ),
                      child: const Icon(
                        Icons.flash_on_rounded,
                        color: AppColors.amber,
                        size: 24,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Manual entry button
            FadeInUp(
              delay: const Duration(milliseconds: 400),
              child: TextButton.icon(
                onPressed: _navigateToManualEntry,
                icon: Icon(
                  Icons.keyboard_rounded,
                  color: AppColors.textSecondary,
                  size: 18,
                ),
                label: Text(
                  'Type Details Manually',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.textSecondary,
                    decoration: TextDecoration.underline,
                    decorationColor: AppColors.textSecondary,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  /// ── Processing / Shimmer State ─────────────────────────────────────────
  Widget _buildProcessingState() {
    return Center(
      child: FadeIn(
        child: Padding(
          padding: const EdgeInsets.all(40),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Animated scanner icon
              Pulse(
                infinite: true,
                child: Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.purple.withValues(alpha: 0.12),
                    border: Border.all(
                      color: AppColors.purple.withValues(alpha: 0.3),
                      width: 2,
                    ),
                  ),
                  child: const Icon(
                    Icons.document_scanner_rounded,
                    size: 48,
                    color: AppColors.purple,
                  ),
                ),
              ),
              const SizedBox(height: 32),
              Text('AI is analyzing...', style: AppTextStyles.heading2),
              const SizedBox(height: 8),
              Text(
                'Extracting book details from your image',
                style: AppTextStyles.bodyMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),

              // Shimmer loading bars
              ...List.generate(3, (index) {
                return Padding(
                  padding: EdgeInsets.only(bottom: 12),
                  child: Shimmer.fromColors(
                    baseColor: AppColors.surface,
                    highlightColor: AppColors.cyan.withValues(alpha: 0.15),
                    child: Container(
                      height: 16,
                      width: [240.0, 180.0, 200.0][index],
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                );
              }),
            ],
          ),
        ),
      ),
    );
  }

  /// ── Corner brackets for viewfinder ─────────────────────────────────────
  List<Widget> _buildCornerBrackets() {
    const bracketSize = 24.0;
    const bracketWidth = 3.0;
    const color = AppColors.cyan;

    return [
      // Top-left
      Positioned(
        top: 0,
        left: 0,
        child: Container(
          width: bracketSize,
          height: bracketSize,
          decoration: const BoxDecoration(
            border: Border(
              top: BorderSide(color: color, width: bracketWidth),
              left: BorderSide(color: color, width: bracketWidth),
            ),
          ),
        ),
      ),
      // Top-right
      Positioned(
        top: 0,
        right: 0,
        child: Container(
          width: bracketSize,
          height: bracketSize,
          decoration: const BoxDecoration(
            border: Border(
              top: BorderSide(color: color, width: bracketWidth),
              right: BorderSide(color: color, width: bracketWidth),
            ),
          ),
        ),
      ),
      // Bottom-left
      Positioned(
        bottom: 0,
        left: 0,
        child: Container(
          width: bracketSize,
          height: bracketSize,
          decoration: const BoxDecoration(
            border: Border(
              bottom: BorderSide(color: color, width: bracketWidth),
              left: BorderSide(color: color, width: bracketWidth),
            ),
          ),
        ),
      ),
      // Bottom-right
      Positioned(
        bottom: 0,
        right: 0,
        child: Container(
          width: bracketSize,
          height: bracketSize,
          decoration: const BoxDecoration(
            border: Border(
              bottom: BorderSide(color: color, width: bracketWidth),
              right: BorderSide(color: color, width: bracketWidth),
            ),
          ),
        ),
      ),
    ];
  }
}
