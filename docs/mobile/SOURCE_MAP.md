# Mobile Source Map — M1

| Mobile concern | Existing platform source | M1 usage |
| --- | --- | --- |
| Public characters | `GET /api/characters`, documented in `backend/README.md` and routed by `api/_lib/adminRoutes.js` | Endpoint constant only; real repository deferred to M2 |
| Release schedule | `GET /api/release-schedule`, documented in `backend/README.md` | Deferred pending the known 16/22 parity decision |
| Character media | Public web origin `https://opmwiki.app` | Relative URLs resolved by `MediaUrlResolver` |
| Visual language | Existing frontend surfaces under `src/` | Dark navy surfaces, cyan primary, coral secondary, compact cards |
| Localization | `src/locales/vi.json` and `src/locales/en.json` | VI default and EN application-shell foundation |
| Backend and persistence | Existing ASP.NET/Postgres platform plus current API compatibility layer | Reused as-is; no M1 backend or schema changes |

The mobile app must consume canonical public contracts rather than importing
web-only JSON or duplicating server persistence rules.

## M1 module map

| Module | Entry point / primary files | Responsibility | Dependencies | Tests |
| --- | --- | --- | --- | --- |
| Bootstrap | `mobile/lib/main.dart`, `app/bootstrap.dart`, `app/app.dart` | Inject immutable configuration and construct the localized application | Flutter, Riverpod | `test/widget_test.dart` |
| Routing | `app/routing/app_router.dart`, `navigation_shell.dart`, `route_names.dart` | Five persistent branches and compact/large adaptive navigation | go_router, Flutter localization | `test/app/navigation_test.dart`, `integration_test/navigation_smoke_test.dart` |
| Theme | `app/theme/app_theme.dart`, `app_colors.dart`, `app_typography.dart`, `app_spacing.dart` | Central OPM Wiki colors, type, spacing and component defaults | Flutter Material | Covered through app/widget tests |
| Configuration | `core/config/app_config.dart`, `environment.dart` | Parse Dart defines, validate origins and expose feature flags | Riverpod | `test/core/config/app_config_test.dart` |
| Networking | `core/network/api_client.dart`, `api_endpoints.dart`, `api_exception.dart`, `network_provider.dart` | Injected Dio transport, GET-only M1 API surface, timeouts, safe logs and stable failures | Dio, Riverpod | `test/core/network/api_exception_test.dart` |
| Media | `core/media/media_url_resolver.dart` | Resolve relative assets against the web origin and reject unsafe schemes | Dart `Uri` | `test/core/media/media_url_resolver_test.dart` |
| Errors | `core/errors/app_error.dart`, `error_mapper.dart` | Translate transport failures into application-level states | Network module | `test/core/network/api_exception_test.dart` |
| Shared states | `shared/widgets/app_loading.dart`, `app_error_view.dart`, `app_empty_state.dart` | Consistent accessible loading, retry and empty states | Flutter Material | `test/shared/widgets/state_widgets_test.dart` |
| Feature presentations | `features/*/presentation/*_page.dart` | Replaceable M1 boundaries for Home, Wiki, Play, Rewards and Profile | App theme, localization, shared widgets | Bootstrap and navigation tests |
| Localization | `l10n/app_vi.arb`, `app_en.arb`, generated localizations | VI default strings and EN expansion foundation | Flutter localization, intl | Bootstrap/navigation assertions |
