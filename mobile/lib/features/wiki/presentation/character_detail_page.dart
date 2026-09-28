import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../l10n/generated/app_localizations.dart';
import '../../../shared/widgets/app_empty_state.dart';
import '../../../shared/widgets/app_error_view.dart';
import '../../../shared/widgets/app_loading.dart';
import 'controllers/character_detail_state.dart';
import 'providers/character_providers.dart';
import 'widgets/character_bond_section.dart';
import 'widgets/character_effects_section.dart';
import 'widgets/character_hero_header.dart';
import 'widgets/character_info_section.dart';
import 'widgets/character_skills_section.dart';
import 'widgets/character_stats_section.dart';

class CharacterDetailPage extends ConsumerWidget {
  const CharacterDetailPage({super.key, required this.characterId});

  final String characterId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(characterDetailControllerProvider(characterId));
    final text = AppLocalizations.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          state.character?.name ?? text.characterDetailTitle,
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: _buildBody(context, ref, state, text),
    );
  }

  Widget _buildBody(
    BuildContext context,
    WidgetRef ref,
    CharacterDetailState state,
    AppLocalizations text,
  ) {
    if (state.isLoading) {
      return Center(child: AppLoading(label: text.loadingLabel));
    }

    if (state.isNotFound) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AppEmptyState(
                title: text.characterNotFound,
                message: text.characterNotFoundDescription,
              ),
              const SizedBox(height: AppSpacing.lg),
              FilledButton.icon(
                onPressed: () => context.pop(),
                icon: const Icon(Icons.arrow_back),
                label: Text(text.backLabel),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.black,
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (state.isError || state.character == null) {
      return Center(
        child: AppErrorView(
          title: text.errorTitle,
          message: state.error?.message ?? '',
          retryLabel: text.retryLabel,
          onRetry: () => ref
              .read(characterDetailControllerProvider(characterId).notifier)
              .retry(),
        ),
      );
    }

    final character = state.character!;

    return RefreshIndicator(
      color: AppColors.primary,
      backgroundColor: AppColors.surfaceRaised,
      onRefresh: () => ref
          .read(characterDetailControllerProvider(characterId).notifier)
          .retry(),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            CharacterHeroHeader(character: character),
            const SizedBox(height: AppSpacing.md),
            CharacterInfoSection(character: character),
            if (character.hasBaseStats || character.hasPvpStats) ...[
              const SizedBox(height: AppSpacing.md),
              CharacterStatsSection(character: character),
            ],
            if (character.hasSkills) ...[
              const SizedBox(height: AppSpacing.md),
              CharacterSkillsSection(skills: character.skills),
            ],
            if (character.hasEffects) ...[
              const SizedBox(height: AppSpacing.md),
              CharacterEffectsSection(effects: character.effects),
            ],
            if (character.hasBonds) ...[
              const SizedBox(height: AppSpacing.md),
              CharacterBondSection(character: character),
            ],
            const SizedBox(height: AppSpacing.xl),
          ],
        ),
      ),
    );
  }
}
