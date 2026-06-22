import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_library_app/main.dart';

void main() {
  testWidgets('App launches without errors', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(child: SmartLibraryApp()),
    );
    // Verify the app renders (splash/loading screen appears)
    expect(find.byType(SmartLibraryApp), findsOneWidget);
  });
}
