import 'package:flutter/material.dart';
import '../services/api_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  static const appBg = Color(0xFF020617);
  static const panel = Color(0xFF111827);
  static const panelSoft = Color(0xFF1F2937);
  static const border = Color(0xFF334155);
  static const accent = Color(0xFFFB923C);
  static const accentSoft = Color(0x1FFB923C);
  static const muted = Color(0xFF94A3B8);

  final emailCtrl = TextEditingController();
  final passwordCtrl = TextEditingController();
  bool loading = false;
  String error = '';

  Future<void> handleLogin() async {
    setState(() {
      loading = true;
      error = '';
    });

    try {
      await ApiService.login(emailCtrl.text.trim(), passwordCtrl.text);
      if (mounted) Navigator.pushReplacementNamed(context, '/home');
    } catch (e) {
      setState(() {
        error = 'Email hoặc mật khẩu không đúng';
      });
    } finally {
      if (mounted) {
        setState(() {
          loading = false;
        });
      }
    }
  }

  @override
  void dispose() {
    emailCtrl.dispose();
    passwordCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: appBg,
      body: Stack(
        children: [
          Positioned(
            right: -120,
            top: -140,
            child: Container(
              width: 360,
              height: 360,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [accentSoft, Color(0x00020617)],
                ),
              ),
            ),
          ),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            width: 42,
                            height: 42,
                            decoration: BoxDecoration(
                              color: const Color(0xFF84CC16),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Center(
                              child: Text(
                                '↗',
                                style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 24,
                                    fontWeight: FontWeight.w900),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          const Flexible(
                            child: Text(
                              'Investment Platform',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 24,
                                  fontWeight: FontWeight.w900),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 64),
                      const Text(
                        'Welcome back',
                        style: TextStyle(
                            color: Color(0xFFFDBA74),
                            fontSize: 14,
                            fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Đăng nhập',
                        style: TextStyle(
                            color: accent,
                            fontSize: 32,
                            fontWeight: FontWeight.w900),
                      ),
                      const SizedBox(height: 28),
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: panel.withValues(alpha: 0.82),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: border),
                          boxShadow: const [
                            BoxShadow(
                                color: Color(0x4D000000),
                                blurRadius: 32,
                                offset: Offset(0, 20)),
                          ],
                        ),
                        child: Column(
                          children: [
                            _AppTextField(
                              controller: emailCtrl,
                              label: 'Email',
                              keyboardType: TextInputType.emailAddress,
                            ),
                            const SizedBox(height: 16),
                            _AppTextField(
                              controller: passwordCtrl,
                              label: 'Mật khẩu (tối thiểu 12 ký tự)',
                              obscureText: true,
                            ),
                            if (error.isNotEmpty) ...[
                              const SizedBox(height: 14),
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: const Color(0x1AF87171),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                      color: const Color(0x33EF4444)),
                                ),
                                child: Text(error,
                                    style: const TextStyle(
                                        color: Color(0xFFF87171),
                                        fontSize: 13)),
                              ),
                            ],
                            const SizedBox(height: 24),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton.icon(
                                onPressed: loading ? null : handleLogin,
                                icon: loading
                                    ? const SizedBox(
                                        width: 18,
                                        height: 18,
                                        child: CircularProgressIndicator(
                                            strokeWidth: 2, color: appBg),
                                      )
                                    : const Icon(Icons.arrow_forward_rounded,
                                        size: 18),
                                label: Text(
                                    loading ? 'Đang xử lý...' : 'Đăng nhập'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: accent,
                                  foregroundColor: appBg,
                                  disabledBackgroundColor:
                                      accent.withValues(alpha: 0.5),
                                  disabledForegroundColor:
                                      appBg.withValues(alpha: 0.7),
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 15),
                                  shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(8)),
                                  textStyle: const TextStyle(
                                      fontWeight: FontWeight.w900),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AppTextField extends StatelessWidget {
  const _AppTextField({
    required this.controller,
    required this.label,
    this.keyboardType,
    this.obscureText = false,
  });

  final TextEditingController controller;
  final String label;
  final TextInputType? keyboardType;
  final bool obscureText;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      obscureText: obscureText,
      style: const TextStyle(color: Color(0xFFFFF7ED)),
      keyboardType: keyboardType,
      cursorColor: _LoginScreenState.accent,
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: _LoginScreenState.muted),
        filled: true,
        fillColor: _LoginScreenState.panelSoft,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFF64748B)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide:
              const BorderSide(color: _LoginScreenState.accent, width: 1.5),
        ),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }
}
