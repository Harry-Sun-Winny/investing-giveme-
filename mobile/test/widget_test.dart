import 'package:flutter_test/flutter_test.dart';
import 'package:investment_platform_mobile/main.dart';

void main() {
  testWidgets('login screen shows app title', (tester) async {
    await tester.pumpWidget(const MyApp(isLoggedIn: false));

    expect(find.text('Investment Platform'), findsWidgets);
  });
}
