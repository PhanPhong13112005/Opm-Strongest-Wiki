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

  test('encodes a literal plus in a UR+ path', () {
    expect(
      resolver
          .resolve('/Characters/Black Sperm (UR+)/Ảnh & mặt.png')
          .toString(),
      'https://opmwiki.app/Characters/Black%20Sperm%20(UR%2B)/%E1%BA%A2nh%20&%20m%E1%BA%B7t.png',
    );
  });

  test('encodes literal plus signs in an SSR+ path and file name', () {
    expect(
      resolver.resolve('/Characters/Metal Knight (SSR+)/SSR+.png').toString(),
      'https://opmwiki.app/Characters/Metal%20Knight%20(SSR%2B)/SSR%2B.png',
    );
  });

  test('does not double encode an already encoded plus', () {
    expect(
      resolver
          .resolve('/Characters/Black%20Sperm%20(UR%2B)/Black_Sperm.png')
          .toString(),
      'https://opmwiki.app/Characters/Black%20Sperm%20(UR%2B)/Black_Sperm.png',
    );
  });

  test('leaves an ordinary media URL unchanged', () {
    expect(
      resolver.resolve('/Characters/Genos/UR.png').toString(),
      'https://opmwiki.app/Characters/Genos/UR.png',
    );
  });

  test('does not encode plus signs in query strings', () {
    expect(
      resolver.resolve('/Characters/Genos/UR.png?signature=a+b').toString(),
      'https://opmwiki.app/Characters/Genos/UR.png?signature=a+b',
    );
  });

  test('keeps spaces, parentheses and Unicode path behavior', () {
    expect(
      resolver.resolve('/Characters/Hùng (UR)/Ảnh mặt.png').toString(),
      'https://opmwiki.app/Characters/H%C3%B9ng%20(UR)/%E1%BA%A2nh%20m%E1%BA%B7t.png',
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
