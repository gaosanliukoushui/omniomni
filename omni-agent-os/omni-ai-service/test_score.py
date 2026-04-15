import sys
sys.stdout.reconfigure(encoding='utf-8')

from services.query_service import QueryService

svc = QueryService()
results = svc._search_with_scores('测试', 3, None)

sys.stdout.write(f"Found {len(results)} results\n")
for doc, score in results:
    source = doc.metadata.get('source', '?')[:50]
    similarity = max(0.0, 1.0 - score / 2.0)
    sys.stdout.write(f"doc={source}, raw_distance={score:.4f}, similarity={similarity:.4f}\n")
