class PagedResponse<T> {
  const PagedResponse({
    required this.items,
    required this.page,
    required this.pageSize,
    required this.totalCount,
    required this.totalPages,
  });

  final List<T> items;
  final int page;
  final int pageSize;
  final int totalCount;
  final int totalPages;

  bool get hasNextPage => page < totalPages;

  factory PagedResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic item) itemDecoder,
  ) {
    final rawItems = json['items'] as List<dynamic>? ?? const [];
    return PagedResponse<T>(
      items: rawItems.map(itemDecoder).toList(),
      page: (json['page'] as num?)?.toInt() ?? 1,
      pageSize: (json['pageSize'] as num?)?.toInt() ?? rawItems.length,
      totalCount: (json['totalCount'] as num?)?.toInt() ?? rawItems.length,
      totalPages: (json['totalPages'] as num?)?.toInt() ?? 1,
    );
  }
}
