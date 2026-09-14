from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import insert, select, and_
from datetime import datetime
from typing import Optional, Union, Callable

from src.models.permission import Permission
import src.database as database


class TrackingRouter(APIRouter):
    """
    Router that automatically tracks all registered routes in the Permission table.
    No DB session is passed during initialization.
    Each DB operation uses a fresh, safe session.
    """

    def _get_session(self) -> Session:
        """Always create a new DB session safely."""
        return database.SessionLocal()

    # def add_api_route(
    #     self,
    #     path: str,
    #     endpoint: Callable,
    #     *,
    #     name: Optional[str] = None,
    #     description: Optional[str] = None,
    #     methods: Optional[Union[set[str], list[str]]] = None,
    #     **kwargs
    # ):
    #     """
    #     Overrides FastAPI's add_api_route to automatically:
    #     - Register API routes
    #     - Insert new routes into Permission table (if not existing)
    #     """

    #     # Register the actual API route
    #     route = super().add_api_route(path, endpoint, name=name, methods=methods, **kwargs)

    #     methods = list(methods or ["GET"])
    #     name = name or endpoint.__name__
    #     description = description or ""

    #     db = self._get_session()

    #     try:
    #         # Get existing methods for this path
    #         existing_methods = set(
    #             m.upper()
    #             for m in db.execute(
    #                 select(Permission.method).where(Permission.path == path)
    #             ).scalars().all()
    #         )

    #         # New permission entries
    #         new_entries = [
    #             {
    #                 "name": name,
    #                 "description": description,
    #                 "path": path,
    #                 "method": method.upper(),
    #                 "created_at": datetime.utcnow()
    #             }
    #             for method in methods
    #             if method.upper() not in existing_methods
    #         ]

    #         # Insert only new missing methods
    #         if new_entries:
    #             db.execute(insert(Permission), new_entries)
    #             db.commit()

    #     except Exception as e:
    #         db.rollback()
    #         print("TrackingRouter Error:", str(e))

    #     finally:
    #         db.close()

    #     return route

    # ------------------------------------------------------------------------------
    #                          Query Helper Functions
    # ------------------------------------------------------------------------------

    def track_route(self, path: str, method: str):
        db = self._get_session()
        try:
            perm = db.execute(
                select(Permission).where(
                    and_(Permission.path == path, Permission.method == method.upper())
                )
            ).scalar_one_or_none()

            if not perm:
                raise HTTPException(
                    status_code=404,
                    detail=f"No entry found for route {method} {path}"
                )

            return {
                "name": perm.name,
                "description": perm.description,
                "path": perm.path,
                "method": perm.method,
                "created_at": perm.created_at
            }

        finally:
            db.close()

    def track_all_routes(self):
        db = self._get_session()
        try:
            perms = db.execute(select(Permission)).scalars().all()
            return [
                {
                    "name": p.name,
                    "description": p.description,
                    "path": p.path,
                    "method": p.method,
                    "created_at": p.created_at
                }
                for p in perms
            ]
        finally:
            db.close()

    def track_routes_by_name(self, name: str):
        db = self._get_session()
        try:
            perms = db.execute(
                select(Permission).where(Permission.name == name)
            ).scalars().all()

            if not perms:
                raise HTTPException(404, f"No routes found for name '{name}'")

            return [
                {
                    "name": p.name,
                    "description": p.description,
                    "path": p.path,
                    "method": p.method,
                    "created_at": p.created_at
                }
                for p in perms
            ]
        finally:
            db.close()

    def track_routes_by_path(self, path: str):
        db = self._get_session()
        try:
            perms = db.execute(
                select(Permission).where(Permission.path == path)
            ).scalars().all()

            if not perms:
                raise HTTPException(404, f"No routes found for path '{path}'")

            return [
                {
                    "name": p.name,
                    "description": p.description,
                    "path": p.path,
                    "method": p.method,
                    "created_at": p.created_at
                }
                for p in perms
            ]
        finally:
            db.close()
