import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  final token = prefs.getString('token');
  runApp(MyApp(isLoggedIn: token != null));
}

class MyApp extends StatelessWidget {
  final bool isLoggedIn;
  const MyApp({super.key, required this.isLoggedIn});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Investment Platform',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFFFB923C), brightness: Brightness.dark),
        scaffoldBackgroundColor: const Color(0xFF020617),
        useMaterial3: true,
      ),
      routes: {
        '/login': (_) => const LoginScreen(),
        '/home': (_) => const DashboardScreen(),
      },
      home: isLoggedIn ? const DashboardScreen() : const LoginScreen(),
    );
  }
}
