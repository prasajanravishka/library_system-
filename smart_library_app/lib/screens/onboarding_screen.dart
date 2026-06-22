import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import '../core/app_theme.dart';
import '../providers/providers.dart';
import 'login_screen.dart';

/// First-Time User Experience (FTUE) Onboarding.
/// A 3-step visual carousel shown only once.
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<_OnboardingPage> _pages = const [
    _OnboardingPage(
      icon: Icons.search_rounded,
      title: 'Search Instantly',
      description:
          'Find any book in seconds. Search by title, author, or ISBN across the entire library catalog.',
      accentColor: AppColors.cyan,
    ),
    _OnboardingPage(
      icon: Icons.document_scanner_rounded,
      title: 'AI-Powered Scanning',
      description:
          'Point your camera at any book cover. Our AI reads and catalogs it automatically — no typing required.',
      accentColor: AppColors.purple,
    ),
    _OnboardingPage(
      icon: Icons.event_available_rounded,
      title: 'Track Due Dates',
      description:
          'Never miss a return date. Get smart reminders and track all your borrowed books in one place.',
      accentColor: AppColors.emerald,
    ),
  ];

  void _onPageChanged(int page) {
    setState(() => _currentPage = page);
  }

  void _nextPage() {
    if (_currentPage < _pages.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOut,
      );
    } else {
      _finishOnboarding();
    }
  }

  void _finishOnboarding() async {
    await markOnboardingSeen();
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.primaryBg,
      body: SafeArea(
        child: Column(
          children: [
            // Skip button
            Align(
              alignment: Alignment.topRight,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: TextButton(
                  onPressed: _finishOnboarding,
                  child: Text(
                    'Skip',
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
              ),
            ),
            // Page view
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                itemCount: _pages.length,
                onPageChanged: _onPageChanged,
                itemBuilder: (context, index) {
                  final page = _pages[index];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 40),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Icon container with glow
                        FadeInDown(
                          duration: const Duration(milliseconds: 600),
                          child: Container(
                            width: 140,
                            height: 140,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: RadialGradient(
                                colors: [
                                  page.accentColor.withValues(alpha: 0.2),
                                  page.accentColor.withValues(alpha: 0.05),
                                  Colors.transparent,
                                ],
                              ),
                            ),
                            child: Container(
                              margin: const EdgeInsets.all(20),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: page.accentColor.withValues(alpha: 0.15),
                                border: Border.all(
                                  color: page.accentColor.withValues(alpha: 0.3),
                                  width: 2,
                                ),
                              ),
                              child: Icon(
                                page.icon,
                                size: 48,
                                color: page.accentColor,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 48),
                        // Title
                        FadeInUp(
                          delay: const Duration(milliseconds: 200),
                          duration: const Duration(milliseconds: 600),
                          child: Text(
                            page.title,
                            style: AppTextStyles.heading1,
                            textAlign: TextAlign.center,
                          ),
                        ),
                        const SizedBox(height: 16),
                        // Description
                        FadeInUp(
                          delay: const Duration(milliseconds: 400),
                          duration: const Duration(milliseconds: 600),
                          child: Text(
                            page.description,
                            style: AppTextStyles.bodyLarge.copyWith(
                              color: AppColors.textSecondary,
                              height: 1.6,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            // Dot indicators
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  _pages.length,
                  (index) => AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: _currentPage == index ? 28 : 8,
                    height: 8,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(4),
                      color: _currentPage == index
                          ? _pages[_currentPage].accentColor
                          : AppColors.textSecondary.withValues(alpha: 0.3),
                    ),
                  ),
                ),
              ),
            ),
            // Action button
            Padding(
              padding: const EdgeInsets.fromLTRB(40, 0, 40, 40),
              child: SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _nextPage,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _pages[_currentPage].accentColor,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: Text(
                    _currentPage == _pages.length - 1
                        ? 'Get Started'
                        : 'Next',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OnboardingPage {
  final IconData icon;
  final String title;
  final String description;
  final Color accentColor;

  const _OnboardingPage({
    required this.icon,
    required this.title,
    required this.description,
    required this.accentColor,
  });
}
