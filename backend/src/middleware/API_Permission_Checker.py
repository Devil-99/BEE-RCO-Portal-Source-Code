from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from sqlalchemy.orm import Session
from src.middleware.Utils.bypass_points import bypass_session_management
from src.models import Permission, RolePermission
from src.database import get_db
import re


class PermissionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):

        try:
            print("PermissionMiddleware")
            # 1️⃣ Skip public and whitelisted routes
            if bypass_session_management(request) or request.method == "OPTIONS":
                return await call_next(request)

            # 2️⃣ Extract role from headers (same as working version)
            role_code = getattr(request.state, "role_code", None)
            print("PermissionMiddleware role_code:", role_code)
            if not role_code:
                raise HTTPException(status_code=401, detail="Missing role code in headers")

            # 3️⃣ Database session
            db: Session = next(get_db())

            # 4️⃣ Extract route safely
            route = request.scope.get("route")            
            if not route:
                return await call_next(request)

            route_name = getattr(route, "name", None)
            route_path = request.url.path
            print("PermissionMiddleware route_name:", route_name)
            print("PermissionMiddleware route_path:", route_path)
            if not route_name and route_path is None:
                raise HTTPException(
                    status_code=403,
                    detail="Route is not named. Please define a route name."
                )
            # 5️⃣ Normalize path: remove version prefix
            normalized_path = re.sub(r"^/v\d+", "", route_path).rstrip("/") or "/"

            # 6️⃣ Permission lookup
            permission = (
                db.query(Permission)
                .filter(
                    Permission.path == normalized_path,
                    Permission.name == route_name
                )
                .first()
            )

            if not permission:
                print("PermissionMiddleware: Permission not found for route", route_name, normalized_path)
                raise HTTPException(status_code=403, detail=f"Permission not found for route {route_name} ({normalized_path})"
                )

            # 7️⃣ Role-permission lookup
            role_perm = (
                db.query(RolePermission)
                .filter(RolePermission.role_code == role_code)
                .first()
            )

            if not role_perm or not role_perm.permission:
                raise HTTPException(status_code=401, detail="No permissions assigned to this role")

            # 8️⃣ Final permission check
            if permission.id not in role_perm.permission:
                raise HTTPException(status_code=401, detail="Access denied: insufficient permissions")

            return await call_next(request)

        except HTTPException as ex:
            return JSONResponse(
                status_code=ex.status_code,
                content={"detail": ex.detail}
            )
        except Exception as ex:
                return JSONResponse(
                    status_code=500,
                    content={"detail": "Internal server error In Middleware"}
                )