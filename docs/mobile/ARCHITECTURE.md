# OPM Wiki Mobile Architecture — M1

Baseline: `dc293046c71088bdbcc223a99ba70940d34d54f6`.

## Boundaries

The Flutter application is a new client of the existing OPM Wiki platform. It
does not create a second backend or database. In M1 the network surface exposes
only HTTP GET through `ApiClient.getJson`; mutations, credentials, rewards,
payments and production administration are deliberately absent.

## Feature-first layout

- `mobile/lib/app`: bootstrap, theme and adaptive shell routing.
- `mobile/lib/core`: environment configuration, media URL policy, networking
  and stable error mapping.
- `mobile/lib/features/<feature>/presentation`: one presentation boundary for
  each of Home, Wiki, Play, Rewards and Profile.
- `mobile/lib/shared/widgets`: reusable loading, empty, error and presentation
  primitives.
- `mobile/lib/l10n`: Vietnamese source localization and English foundation.

`StatefulShellRoute.indexedStack` owns five branches so search and scroll state
survive tab switches. Widths below 840 logical pixels use `NavigationBar`; wider
layouts use `NavigationRail`.

## Environment and media

Configuration is injected with Riverpod and compile-time Dart defines. API and
asset origins remain separate. Production accepts HTTPS origins only. Relative
media paths resolve against the asset origin; absolute HTTP(S) URLs are kept;
protocol-relative and non-HTTP schemes are rejected.

## Deferred work

M2 owns production API models/repositories, real content screens and the release
schedule parity decision. M3 owns authentication and secure storage. Cached
network images are not added until a real media surface needs them.
