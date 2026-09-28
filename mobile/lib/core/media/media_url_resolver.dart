import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/app_config.dart';

final mediaUrlResolverProvider = Provider<MediaUrlResolver>((ref) {
  final config = ref.watch(appConfigProvider);
  return MediaUrlResolver(config.assetBaseUri);
});

class MediaUrlResolver {
  const MediaUrlResolver(this.assetBaseUri);

  final Uri assetBaseUri;

  Uri resolve(String source) {
    final value = source.trim();
    if (value.isEmpty || value.startsWith('//')) {
      throw const FormatException('Media URL is empty or protocol-relative.');
    }
    final parsed = Uri.tryParse(value);
    if (parsed == null) throw const FormatException('Media URL is invalid.');
    if (parsed.isAbsolute) {
      if (!{'http', 'https'}.contains(parsed.scheme)) {
        throw FormatException('Unsafe media URL scheme: ${parsed.scheme}');
      }
      return _encodeLiteralPlusesInPath(parsed);
    }
    return _encodeLiteralPlusesInPath(
      assetBaseUri.resolve(value.replaceFirst(RegExp(r'^/+'), '')),
    );
  }

  Uri _encodeLiteralPlusesInPath(Uri uri) {
    final serialized = uri.toString();
    var pathStart = uri.hasScheme ? serialized.indexOf(':') + 1 : 0;

    if (serialized.startsWith('//', pathStart)) {
      pathStart += 2;
      final authorityEnd = serialized.indexOf(RegExp(r'[/\\?#]'), pathStart);
      if (authorityEnd == -1) return uri;
      pathStart = authorityEnd;
    }

    final queryStart = serialized.indexOf('?', pathStart);
    final fragmentStart = serialized.indexOf('#', pathStart);
    var pathEnd = serialized.length;
    if (queryStart != -1 && queryStart < pathEnd) pathEnd = queryStart;
    if (fragmentStart != -1 && fragmentStart < pathEnd) {
      pathEnd = fragmentStart;
    }

    final encodedPath = serialized.substring(pathStart, pathEnd);
    if (!encodedPath.contains('+')) return uri;

    final safePath = encodedPath.replaceAll('+', '%2B');
    return Uri.parse(
      '${serialized.substring(0, pathStart)}$safePath'
      '${serialized.substring(pathEnd)}',
    );
  }
}
