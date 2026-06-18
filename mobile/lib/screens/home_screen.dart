import 'package:flutter/material.dart';
import '../services/api_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List portfolios = [];
  List watchlists = [];
  List goals = [];
  bool loading = true;
  int currentIndex = 0;

  @override
  void initState() {
    super.initState();
    loadData();
  }

  Future<void> loadData() async {
    try {
      final p = await ApiService.getPortfolios();
      final w = await ApiService.getWatchlists();
      final g = await ApiService.getGoals();
      setState(() { portfolios = p; watchlists = w; goals = g; loading = false; });
    } catch (e) {
      setState(() { loading = false; });
    }
  }

  Future<void> logout() async {
    await ApiService.clearToken();
    if (mounted) Navigator.pushReplacementNamed(context, '/');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text('💹 Investment', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Color(0xFF94A3B8)),
            onPressed: logout,
          ),
        ],
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF3B82F6)))
          : RefreshIndicator(
              onRefresh: loadData,
              child: _buildBody(),
            ),
      bottomNavigationBar: BottomNavigationBar(
        backgroundColor: const Color(0xFF1E293B),
        selectedItemColor: const Color(0xFF3B82F6),
        unselectedItemColor: const Color(0xFF64748B),
        currentIndex: currentIndex,
        onTap: (i) => setState(() => currentIndex = i),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.pie_chart), label: 'Portfolio'),
          BottomNavigationBarItem(icon: Icon(Icons.visibility), label: 'Watchlist'),
          BottomNavigationBarItem(icon: Icon(Icons.track_changes), label: 'Mục tiêu'),
        ],
      ),
    );
  }

  Widget _buildBody() {
    switch (currentIndex) {
      case 0: return _buildPortfolios();
      case 1: return _buildWatchlists();
      case 2: return _buildGoals();
      default: return _buildPortfolios();
    }
  }

  Widget _buildPortfolios() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _statCard('📊 Portfolios', portfolios.length.toString(), const Color(0xFF3B82F6)),
        const SizedBox(height: 16),
        if (portfolios.isEmpty)
          const Center(child: Text('Chưa có portfolio', style: TextStyle(color: Color(0xFF64748B)))),
        ...portfolios.map((p) => _portfolioCard(p)),
      ],
    );
  }

  Widget _buildWatchlists() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _statCard('👁 Watchlists', watchlists.length.toString(), const Color(0xFF8B5CF6)),
        const SizedBox(height: 16),
        if (watchlists.isEmpty)
          const Center(child: Text('Chưa có watchlist', style: TextStyle(color: Color(0xFF64748B)))),
        ...watchlists.map((w) => _listCard(w['name'], new DateTime.parse(w['createdAt']).toLocal().toString().slice(0,10))),
      ],
    );
  }

  Widget _buildGoals() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _statCard('🎯 Mục tiêu', goals.length.toString(), const Color(0xFF10B981)),
        const SizedBox(height: 16),
        if (goals.isEmpty)
          const Center(child: Text('Chưa có mục tiêu', style: TextStyle(color: Color(0xFF64748B)))),
        ...goals.map((g) => _goalCard(g)),
      ],
    );
  }

  Widget _statCard(String title, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Text(title, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 14)),
          const Spacer(),
          Text(value, style: TextStyle(color: color, fontSize: 24, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _portfolioCard(Map p) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF334155)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(p['name'], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                Text(p['baseCurrency'], style: const TextStyle(color: Color(0xFF64748B), fontSize: 12)),
              ],
            ),
          ),
          const Icon(Icons.arrow_forward_ios, color: Color(0xFF64748B), size: 16),
        ],
      ),
    );
  }

  Widget _listCard(String name, String date) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF334155)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                Text(date, style: const TextStyle(color: Color(0xFF64748B), fontSize: 12)),
              ],
            ),
          ),
          const Icon(Icons.arrow_forward_ios, color: Color(0xFF64748B), size: 16),
        ],
      ),
    );
  }

  Widget _goalCard(Map g) {
    final current = (g['currentAmount'] as num).toDouble();
    final target = (g['targetAmount'] as num).toDouble();
    final pct = target > 0 ? (current / target).clamp(0.0, 1.0) : 0.0;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF334155)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(g['name'], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          LinearProgressIndicator(
            value: pct,
            backgroundColor: const Color(0xFF334155),
            color: const Color(0xFF10B981),
          ),
          const SizedBox(height: 4),
          Text('${(pct * 100).toStringAsFixed(0)}% · ${g['currency']}',
            style: const TextStyle(color: Color(0xFF64748B), fontSize: 12)),
        ],
      ),
    );
  }
}

extension on String {
  String slice(int start, int end) => substring(start, end);
}