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
      return parsed;
    }
    return assetBaseUri.resolve(value.replaceFirst(RegExp(r'^/+'), ''));
  }
}
