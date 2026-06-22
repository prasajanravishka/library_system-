import 'dart:ui';
import 'package:flutter/material.dart';
import '../core/app_theme.dart';

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
    final decoration = BoxDecoration(
      color: backgroundColor ?? AppColors.glassSurface,
      borderRadius: BorderRadius.circular(borderRadius),
      border: Border.all(
        color: borderColor ?? AppColors.borderSubtle,
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
