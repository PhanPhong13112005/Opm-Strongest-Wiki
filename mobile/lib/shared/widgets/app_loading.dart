import 'package:flutter/material.dart';

class AppLoading extends StatelessWidget {
  const AppLoading({super.key, required this.label});
  final String label;

  @override
  Widget build(BuildContext context) => Center(
    child: Semantics(
      label: label,
      liveRegion: true,
      child: const SizedBox.square(
        dimension: 36,
        child: CircularProgressIndicator(),
      ),
    ),
  );
}
