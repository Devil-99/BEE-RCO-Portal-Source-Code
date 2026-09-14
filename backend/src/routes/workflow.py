from fastapi import (HTTPException,Depends,Request,status)
from sqlalchemy.orm import Session
from typing import List
from src.utils.TrackingRouter import TrackingRouter
from src.database import get_db
from src.models.workflow import Workflow
from src.models.financial_year import FinancialYear
from src.models.roles import Role
from src.schemas.workflow import (
    WorkflowCreate,
    WorkflowOut
)
from src.utils.security import verify_user_access

import logging
logger = logging.getLogger(__name__)

router = TrackingRouter(tags=["Workflows"])


# ---------- Create Workflow ----------
@router.post("/workflows/create-workflow",response_model=WorkflowOut)
def create_workflow(
    workflow_data: WorkflowCreate,
    request: Request,
    db: Session = Depends(get_db)
):

    # ---------- Admin Access Check ----------
    access_roles= {"ADM"}
    verify_user_access(request, access_roles, db)

    required_fields = [
        "name",
        "fy_id"
    ]

    for field in required_fields:

        if not getattr(workflow_data, field):

            raise HTTPException(
                status_code=400,
                detail=f"{field} is required"
            )

    try:

        new_workflow = Workflow(
            name=workflow_data.name,
            form_type=workflow_data.form_type,
            fy_id=workflow_data.fy_id,
            default=workflow_data.default,
            steps_json=workflow_data.steps or []
        )

        db.add(new_workflow)

        db.commit()

        db.refresh(new_workflow)

        logger.info("[CREATE_WORKFLOW] Workflow created successfully")
        return new_workflow

    except Exception as e:

        db.rollback()

        logger.error("[CREATE_WORKFLOW] Failed to create workflow", exc_info=True)

        raise HTTPException(
            status_code=500,
            detail="Something went wrong"
        )

# ---------- Get Workflows ----------
@router.get("/workflows/get-workflows")
def get_workflows(
    request: Request,
    db: Session = Depends(get_db)
):
    allowed_roles = [
        "ADM",
        "SLR"
    ]
    user_role_code = getattr(request.state, "role_code", None)

    if user_role_code not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    try:

        workflows = (
            db.query(Workflow)
            .order_by(Workflow.id.desc())
            .all()
        )

        response = []

        for workflow in workflows:

            financial_year = (
                db.query(FinancialYear)
                .filter(FinancialYear.id == workflow.fy_id)
                .first()
            )

            step_ids = workflow.steps_json or []

            role_names = []

            if step_ids:

                roles = (
                    db.query(Role)
                    .filter(Role.id.in_(step_ids))
                    .all()
                )

                role_map = {
                    role.id: role.role_name
                    for role in roles
                }

                role_names = [
                    role_map[role_id]
                    for role_id in step_ids
                    if role_id in role_map
                ]
                if user_role_code == "ADM":
                    response.append({
                        "id": workflow.id,
                        "name": workflow.name,
                        "form_type": workflow.form_type,
                        "fy_id": workflow.fy_id,
                        "fy_code": (
                            financial_year.fy_code
                            if financial_year
                            else None
                        ),
                        "steps_json": workflow.steps_json,
                        "step_names": role_names,
                        "default": workflow.default
                    })
                else:
                    response.append({
                        "id": workflow.id,
                        "name": workflow.name,
                        "form_type": workflow.form_type,
                        "fy_id": workflow.fy_id,
                        "default": workflow.default
                    })

        return response

    except Exception as e:

        logger.error("[GET_WORKFLOWS] Failed to fetch workflows", exc_info=True)

        raise HTTPException(
            status_code=500,
            detail="Something went wrong"
        )


# ---------- Update Workflow ----------
@router.put("/workflows/update-workflow/{workflow_id}",response_model=WorkflowOut)
def update_workflow(
    workflow_id: int,
    workflow_data: WorkflowCreate,
    request: Request,
    db: Session = Depends(get_db)
):

    # ---------- Admin Access Check ----------
    access_roles= {"ADM"}
    verify_user_access(request, access_roles, db)

    workflow = (
        db.query(Workflow)
        .filter(Workflow.id == workflow_id)
        .first()
    )

    if not workflow:
        logger.warning(f"[UPDATE_WORKFLOW] Workflow not found with id: {workflow_id}")
        raise HTTPException(
            status_code=404,
            detail="Workflow not found"
        )

    try:

        # ---------- Partial Updates ----------

        if workflow_data.name is not None:
            workflow.name = workflow_data.name

        if workflow_data.form_type is not None:
            workflow.form_type = workflow_data.form_type

        if workflow_data.fy_id is not None:
            workflow.fy_id = workflow_data.fy_id

        if workflow_data.default is not None:
            workflow.default = workflow_data.default

        if workflow_data.steps is not None:
            workflow.steps_json = workflow_data.steps

        db.commit()

        db.refresh(workflow)

        logger.info("[UPDATE_WORKFLOW] Workflow updated successfully")
        return workflow

    except Exception as e:

        db.rollback()

        logger.error("[UPDATE_WORKFLOW] Failed to update workflow", exc_info=True)

        raise HTTPException(
            status_code=500,
            detail="Something went wrong"
        )