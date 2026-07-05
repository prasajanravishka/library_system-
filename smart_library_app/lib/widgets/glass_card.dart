import 'dart:ui';
import 'package:flutter/material.dart';

/// A reusable glassmorphism container widget.
/// Uses the design system surface color with alpha transparency and optional backdrop blur.
class GlassCard extends StatelessWidget {
  final Widget child;
  final double borderRadius;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final Color? borderColor;
  final double borderWidth;
  final bool enableBlur;
  final double blurSigma;
  final Color? backgroundColor;
  final List<BoxShadow>? boxShadow;

  const GlassCard({
    super.key,
    required this.child,
    this.borderRadius = 16,
    this.padding,
    this.margin,
    this.borderColor,
    this.borderWidth = 1,
    this.enableBlur = true,
    this.blurSigma = 10,
    this.backgroundColor,
    this.boxShadow,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final decoration = BoxDecoration(
      color: backgroundColor ?? Theme.of(context).colorScheme.surface.withValues(alpha: 0.8),
      borderRadius: BorderRadius.circular(borderRadius),
      border: Border.all(
        color: borderColor ?? (isDark ? Colors.white.withValues(alpha: 0.1) : Colors.black.withValues(alpha: 0.1)),
        width: borderWidth,
      ),
      boxShadow: boxShadow,
    );

    Widget content = Container(
      padding: padding,
      margin: margin,
      decoration: decoration,
      child: child,
    );

    if (enableBlur) {
      content = ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: blurSigma, sigmaY: blurSigma),
          child: content,
        ),
      );
    }

    return content;
  }
}
