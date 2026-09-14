from fastapi import Request

from src.middleware.whitelistedPaths import starts_with_paths, exact_paths


def bypass_session_management(request: Request) -> bool:
    """
    Return True when the incoming request should bypass session checks.
    Supports:
      - OPTIONS method
      - paths that start with any value in starts_with_paths
      - exact-match public paths in exact_paths
    """
    if request.method == "OPTIONS":
        return True

    path = request.url.path

    # startswith checks
    for p in starts_with_paths:
        if path.startswith(p):
            return True

    # exact-match checks
    if path in exact_paths:
        return True

    return False
