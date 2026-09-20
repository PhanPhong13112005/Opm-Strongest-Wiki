import 'package:flutter_test/flutter_test.dart';
import 'package:opmwiki_mobile/core/media/media_url_resolver.dart';

void main() {
  final resolver = MediaUrlResolver(Uri.parse('https://opmwiki.app'));

  test('resolves relative media paths against the asset origin', () {
    expect(
      resolver.resolve('/Characters/Homeless Emperor/URplus.png').toString(),
      'https://opmwiki.app/Characters/Homeless%20Emperor/URplus.png',
    );
  });

  test('keeps safe absolute media URLs', () {
    expect(
      resolver.resolve('https://cdn.example.test/image.png').toString(),
      'https://cdn.example.test/image.png',
    );
  });

  test('rejects protocol-relative and unsafe schemes', () {
    expect(
      () => resolver.resolve('//example.test/image.png'),
      throwsFormatException,
    );
    expect(
      () => resolver.resolve('javascript:alert(1)'),
      throwsFormatException,
    );
    expect(
      () => resolver.resolve('data:image/png;base64,AA'),
      throwsFormatException,
    );
    expect(
      () => resolver.resolve('file:///tmp/image.png'),
      throwsFormatException,
    );
  });
}
