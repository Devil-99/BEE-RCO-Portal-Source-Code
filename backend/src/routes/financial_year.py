from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from src.utils.TrackingRouter import TrackingRouter
from src.models.financial_year import FinancialYear
from src.schemas.financial_year import FinancialYearCreate, FinancialYearResponse, FinancialYearUpdate
from src.database import get_db
from src.utils.security import verify_user_access

import logging
logger = logging.getLogger(__name__)

router = TrackingRouter(tags=["Financial Year"])


#Function to check 366 days difference between start date and end date
def validate_date_range(start_date, end_date):
    delta = (end_date - start_date).days
    if delta < 0:
        raise HTTPException(status_code=400, detail="End Date must be after Start Date.")
    if delta > 366:
        raise HTTPException(status_code=400, detail="Duration must not exceed 365 days.")
    
# Create financial year
@router.post("/create-financial-year", response_model=FinancialYearResponse, status_code=status.HTTP_201_CREATED)
def create_financial_year(
    request: Request,
    data: FinancialYearCreate,
    db: Session = Depends(get_db)
):
    logger.info("[CREATE_FINANCIAL_YEAR] Request received")
    access_roles= {"ADM"}
    verify_user_access(request, access_roles, db)

    # Validate date range(366days)
    validate_date_range(data.start_date, data.end_date)
    
    db_obj = FinancialYear(**data.model_dump(exclude={"quarter", "year"}))
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    logger.info("[CREATE_FINANCIAL_YEAR] Financial year created successfully")
    return db_obj

# List all financial years
@router.get("/get-financial-years", response_model=list[FinancialYearResponse])
def list_financial_years(
    db: Session = Depends(get_db)
):
    return db.query(FinancialYear).all()

# Update financial year
@router.put("/update-financial-year/{id}", response_model=FinancialYearResponse)
def update_financial_year(
    request: Request,
    id: int,
    data: FinancialYearUpdate,
    db: Session = Depends(get_db)
):
    logger.info("[UPDATE_FINANCIAL_YEAR] Request received")
    access_roles= {"ADM"}
    verify_user_access(request, access_roles, db)
    record = db.query(FinancialYear).filter(FinancialYear.id == id).first()
    if not record:
        logger.warning(f"[UPDATE_FINANCIAL_YEAR] Financial year not found with id: {id}")
        raise HTTPException(status_code=404, detail="Not found")

    #👉 Only the provided fields are updated
     #Other fields remain unchanged in the database
    payload = data.model_dump(exclude_unset=True)

    if "start_date" in payload or "end_date" in payload:
        validate_date_range(
            payload.get("start_date", record.start_date),
            payload.get("end_date", record.end_date),
        )

    for key, value in payload.items():
        setattr(record, key, value)

    db.commit()
    db.refresh(record)
    logger.info("[UPDATE_FINANCIAL_YEAR] Financial year updated successfully")
    return record

# Delete financial year
@router.delete("/delete-financial-year/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_financial_year(
    request: Request,
    id: int,
    db: Session = Depends(get_db)
):
    logger.info("[DELETE_FINANCIAL_YEAR] Request received")
    access_roles= {"ADM"}
    verify_user_access(request, access_roles, db)

    record = db.query(FinancialYear).filter(FinancialYear.id == id).first()
    if not record:
        logger.warning(f"[DELETE_FINANCIAL_YEAR] Financial year not found with id: {id}")
        raise HTTPException(status_code=404, detail="Financial Year not found")

    db.delete(record)
    db.commit()
    logger.info("[DELETE_FINANCIAL_YEAR] Financial year deleted successfully")
    return