from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from src.database import get_db
from src.models.roles import Role
from src.models.workflow import Workflow
from src.schemas import create_role_request, get_all_roles_response
from src.utils.security import verify_user_access

import logging
logger = logging.getLogger(__name__)

router = APIRouter(tags=["Roles"])

@router.get("/admin/get-all-roles", response_model=List[get_all_roles_response])
def get_all_roles(
    request: Request,
    db: Session = Depends(get_db)
):
    access_roles = {"ADM","SNA","SPA"}
    verify_user_access(request, access_roles, db)
    
    roles = db.query(Role).all()

    # Any role that appears as a step in a workflow is an actual approval stage
    stage_role_ids = set()
    for workflow in db.query(Workflow).all():
        steps = workflow.steps_json or []
        if isinstance(steps, list):
            stage_role_ids.update(s for s in steps if isinstance(s, int))

    return [
        {
            "id": role.id,
            "role_name": role.role_name,
            "role_code": role.role_code,
            "description": role.description,
            "is_stage": role.id in stage_role_ids,
        }
        for role in roles
    ]


@router.post("/admin/create-role", status_code=status.HTTP_201_CREATED)
def create_role(
    request: Request,
    payload: create_role_request,
    db: Session = Depends(get_db)
):
    try:
        access_roles = {"ADM"}
        verify_user_access(request, access_roles, db)

        existing = db.query(Role).filter(Role.role_code == payload.role_code).first()
        if existing:
            logger.warning(f"[CREATE_ROLE] Role with code '{payload.role_code}' already exists")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Role with code '{payload.role_code}' already exists."
            )

        new_role = Role(
            role_code=payload.role_code,
            role_name=payload.role_name,
            description=payload.description
        )
        db.add(new_role)
        db.commit()
        db.refresh(new_role)

        logger.info("[CREATE_ROLE] Role created successfully")
        return {
            "id": new_role.id,
            "role_code": new_role.role_code,
            "role_name": new_role.role_name,
            "description": new_role.description
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        logger.error("[CREATE_ROLE] Failed to create role", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create role"
        )