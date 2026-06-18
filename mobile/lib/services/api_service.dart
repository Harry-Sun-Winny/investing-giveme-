import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

String get baseUrl {
  if (defaultTargetPlatform == TargetPlatform.iOS) {
    return 'http://localhost:8080';
  }
  return 'http://10.0.2.2:8080';
}

String get stockProxyUrl {
  if (defaultTargetPlatform == TargetPlatform.iOS) {
    return 'http://localhost:3000';
  }
  return 'http://10.0.2.2:3000';
}

// ============ MODELS ============

class Portfolio {
  final String id;
  final String userId;
  final String name;
  final String baseCurrency;
  final String type;
  final String createdAt;

  Portfolio({required this.id, required this.userId, required this.name, 
             required this.baseCurrency, required this.type, required this.createdAt});

  factory Portfolio.fromJson(Map<String, dynamic> j) => Portfolio(
    id: j['id'], userId: j['userId'], name: j['name'],
    baseCurrency: j['baseCurrency'], type: j['type'] ?? 'STOCKS',
    createdAt: j['createdAt'],
  );
}

class Transaction {
  final String id;
  final String portfolioId;
  final String assetSymbol;
  final String assetName;
  final String type;
  final double quantity;
  final double price;
  final String currency;
  final String transactionDate;
  final String? notes;

  Transaction({required this.id, required this.portfolioId, required this.assetSymbol,
               required this.assetName, required this.type, required this.quantity,
               required this.price, required this.currency, required this.transactionDate,
               this.notes});

  factory Transaction.fromJson(Map<String, dynamic> j) => Transaction(
    id: j['id'], portfolioId: j['portfolioId'], assetSymbol: j['assetSymbol'],
    assetName: j['assetName'], type: j['type'],
    quantity: (j['quantity'] as num).toDouble(),
    price: (j['price'] as num).toDouble(),
    currency: j['currency'], transactionDate: j['transactionDate'],
    notes: j['notes'],
  );
}

// ============ API SERVICE ============

class ApiService {
  // Token management
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
  }

  static Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
  }

  static Future<Map<String, String>> _headers() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // ============ AUTH ============

  /// Đăng nhập - trả về token nếu thành công
  static Future<bool> login(String email, String password) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/v1/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      await saveToken(data['token']);
      return true;
    }
    return false;
  }

  /// Đăng ký tài khoản mới
  static Future<bool> register(String email, String password, String fullName) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/v1/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password, 'fullName': fullName}),
    );
    if (res.statusCode == 200 || res.statusCode == 201) {
      final data = jsonDecode(res.body);
      await saveToken(data['token']);
      return true;
    }
    return false;
  }

  /// Đăng xuất
  static Future<void> logout() async {
    await clearToken();
  }

  // ============ PORTFOLIO ============

  /// Lấy danh sách portfolio của user
  static Future<List<Map<String, dynamic>>> getPortfolios() async {
    final res = await http.get(
      Uri.parse('$baseUrl/api/v1/portfolios'),
      headers: await _headers(),
    );
    if (res.statusCode == 200) {
      final List data = jsonDecode(res.body);
      return data.cast<Map<String, dynamic>>();
    }
    throw Exception('Lỗi tải portfolio: ${res.statusCode}');
  }

  /// Tạo portfolio mới
  static Future<Portfolio> createPortfolio(String name, String baseCurrency, String type) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/v1/portfolios'),
      headers: await _headers(),
      body: jsonEncode({'name': name, 'baseCurrency': baseCurrency, 'type': type}),
    );
    if (res.statusCode == 201) {
      return Portfolio.fromJson(jsonDecode(res.body));
    }
    throw Exception('Lỗi tạo portfolio: ${res.statusCode}');
  }

  /// Xóa portfolio
  static Future<void> deletePortfolio(String id) async {
    final res = await http.delete(
      Uri.parse('$baseUrl/api/v1/portfolios/$id'),
      headers: await _headers(),
    );
    if (res.statusCode != 204) {
      throw Exception('Lỗi xóa portfolio: ${res.statusCode}');
    }
  }

  // ============ TRANSACTIONS ============

  /// Lấy danh sách giao dịch của portfolio
  static Future<List<Map<String, dynamic>>> getTransactions(String portfolioId) async {
    final res = await http.get(
      Uri.parse('$baseUrl/api/v1/portfolios/$portfolioId/transactions'),
      headers: await _headers(),
    );
    if (res.statusCode == 200) {
      final List data = jsonDecode(res.body);
      return data.cast<Map<String, dynamic>>();
    }
    throw Exception('Lỗi tải giao dịch: ${res.statusCode}');
  }

  /// Thêm giao dịch mới
  static Future<Transaction> createTransaction({
    required String portfolioId,
    required String assetSymbol,
    required String assetName,
    required String type,
    required double quantity,
    required double price,
    required String currency,
    required String transactionDate,
    String? notes,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/v1/portfolios/$portfolioId/transactions'),
      headers: await _headers(),
      body: jsonEncode({
        'assetSymbol': assetSymbol, 'assetName': assetName,
        'type': type, 'quantity': quantity, 'price': price,
        'currency': currency, 'transactionDate': transactionDate,
        if (notes != null) 'notes': notes,
      }),
    );
    if (res.statusCode == 201) {
      return Transaction.fromJson(jsonDecode(res.body));
    }
    throw Exception('Lỗi tạo giao dịch: ${res.statusCode}');
  }

  /// Xóa giao dịch
  static Future<void> deleteTransaction(String portfolioId, String transactionId) async {
    final res = await http.delete(
      Uri.parse('$baseUrl/api/v1/portfolios/$portfolioId/transactions/$transactionId'),
      headers: await _headers(),
    );
    if (res.statusCode != 204) {
      throw Exception('Lỗi xóa giao dịch: ${res.statusCode}');
    }
  }

  static Future<List<Map<String, dynamic>>> getWatchlists() async {
    final res = await http.get(
      Uri.parse('$baseUrl/api/v1/watchlists'),
      headers: await _headers(),
    );
    if (res.statusCode == 200) {
      final List data = jsonDecode(res.body);
      return data.cast<Map<String, dynamic>>();
    }
    return [];
  }

  static Future<List<Map<String, dynamic>>> getGoals() async {
    final res = await http.get(
      Uri.parse('$baseUrl/api/v1/goals'),
      headers: await _headers(),
    );
    if (res.statusCode == 200) {
      final List data = jsonDecode(res.body);
      return data.cast<Map<String, dynamic>>();
    }
    return [];
  }

  // ============ STOCK PRICE ============

  /// Lấy giá cổ phiếu realtime từ Yahoo Finance (qua Next.js proxy)
  static Future<Map<String, dynamic>?> getStockPrice(String symbol) async {
    try {
      final res = await http.get(
        Uri.parse('$stockProxyUrl/api/stock-price?symbol=$symbol'),
      );
      if (res.statusCode == 200) return jsonDecode(res.body);
    } catch (_) {}
    return null;
  }
}
