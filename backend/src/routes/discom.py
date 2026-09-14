# src/routes/discom_routes.py

import re
from typing import List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

# Adjust imports to match your project structure
from src.models import roles
from src.database import get_db
from src.models import (
    DiscomFormSection, DiscomFormField,
    
)
from src.models import SubmissionMaster , SubmissionDetails 
from src.schemas.discom import (
    DiscomFormSectionBase, DiscomFormSectionResponse,
    DiscomFormFieldBase, DiscomFormFieldResponse,
)
from ..utils.enums import SubmissionStatusEnum, FormTypeEnum
from src.utils.TrackingRouter import TrackingRouter
from src.database import get_db

import logging
logger = logging.getLogger(__name__)

router = TrackingRouter( tags=["DISCOM Form"])

# ----------------- Section APIs -----------------

@router.post("/discom/sections", response_model=DiscomFormSectionResponse, status_code=status.HTTP_201_CREATED)
def create_discom_section(section: DiscomFormSectionBase, db: Session = Depends(get_db)):
    """Creates a new section for the DISCOM form."""
    existing = db.query(DiscomFormSection).filter(DiscomFormSection.title == section.title).first()
    if existing:
        logger.warning(f"[CREATE_DISCOM_SECTION] Section already exists with title: {section.title}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Section with this title already exists.")
    
    new_section = DiscomFormSection(**section.dict())
    db.add(new_section)
    db.commit()
    db.refresh(new_section)
    logger.info("[CREATE_DISCOM_SECTION] Section created successfully")
    return new_section

@router.get("/discom/sections", response_model=List[DiscomFormSectionResponse])
def get_all_discom_sections(db: Session = Depends(get_db)):
    """Retrieves all sections for the DISCOM form."""
    print("discom sections")
    return db.query(DiscomFormSection).order_by(DiscomFormSection.id).all()


# ----------------- Field APIs -----------------

@router.post("/discom/fields", response_model=DiscomFormFieldResponse, status_code=status.HTTP_201_CREATED)
def create_discom_field(field: DiscomFormFieldBase, db: Session = Depends(get_db)):
    """Creates a new field for the DISCOM form within a given section."""
    if not db.query(DiscomFormSection).filter(DiscomFormSection.id == field.section_id).first():
        logger.warning(f"[CREATE_DISCOM_FIELD] Section not found with id: {field.section_id}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section not found.")

    if db.query(DiscomFormField).filter(DiscomFormField.acronym == field.acronym).first():
        logger.warning(f"[CREATE_DISCOM_FIELD] Acronym already exists: {field.acronym}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Acronym already exists.")

    if db.query(DiscomFormField).filter(DiscomFormField.section_id == field.section_id, DiscomFormField.serial == field.serial).first():
        logger.warning(f"[CREATE_DISCOM_FIELD] Serial already exists in this section: {field.serial}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Serial already exists in this section.")
    
    new_field = DiscomFormField(**field.dict())
    db.add(new_field)
    db.commit()
    db.refresh(new_field)
    logger.info("[CREATE_DISCOM_FIELD] Field created successfully")
    return new_field

@router.get("/discom/fields", response_model=List[DiscomFormFieldResponse])
def get_all_discom_fields(db: Session = Depends(get_db)):
    """Retrieves all fields for the DISCOM form, ordered by section and serial."""
    return db.query(DiscomFormField).order_by(DiscomFormField.section_id, DiscomFormField.serial).all()

@router.get("/fields/{field_id}", response_model=DiscomFormFieldResponse)
def get_discom_field(field_id: int, db: Session = Depends(get_db)):
    """
    Retrieves a single DISCOM form field by its unique primary key ID.
    """
    field = db.query(DiscomFormField).filter(DiscomFormField.id == field_id).first()
    if not field:
        logger.warning(f"[GET_DISCOM_FIELD] Form field not found with id: {field_id}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form field not found")
    return field


@router.put("/discom/fields/{field_id}", response_model=DiscomFormFieldResponse)
def update_discom_field(field_id: int, field_data: DiscomFormFieldBase, db: Session = Depends(get_db)):
    """
    Updates the details of an existing DISCOM form field.
    It checks for uniqueness of the acronym and the serial number within its section.
    """
    # Fetch the existing field by its primary key ID
    field = db.query(DiscomFormField).filter(DiscomFormField.id == field_id).first()
    if not field:
        logger.warning(f"[UPDATE_DISCOM_FIELD] Form field not found with id: {field_id}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form field not found")

    # Check for acronym uniqueness if it has been changed
    if field_data.acronym != field.acronym:
        acronym_exists = db.query(DiscomFormField).filter(DiscomFormField.acronym == field_data.acronym).first()
        if acronym_exists:
            logger.warning(f"[UPDATE_DISCOM_FIELD] Acronym already in use: {field_data.acronym}")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This acronym is already in use.")

    # Check for serial uniqueness within the new section if serial or section has changed
    if field_data.serial != field.serial or field_data.section_id != field.section_id:
        serial_exists = db.query(DiscomFormField).filter(
            DiscomFormField.section_id == field_data.section_id,
            DiscomFormField.serial == field_data.serial
        ).first()
        if serial_exists:
            logger.warning(f"[UPDATE_DISCOM_FIELD] Serial already in use for this section: {field_data.serial}")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This serial number is already in use for this section.")

    # Update the field object with the new data from the request body
    for key, value in field_data.dict().items():
        setattr(field, key, value)
        
    db.commit()
    db.refresh(field)
    logger.info("[UPDATE_DISCOM_FIELD] Field updated successfully")
    return field


@router.delete("/fields/{field_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_discom_field(field_id: int, db: Session = Depends(get_db)):
    """
    Deletes a DISCOM form field by its unique primary key ID.
    """
    field = db.query(DiscomFormField).filter(DiscomFormField.id == field_id).first()
    if not field:
        logger.warning(f"[DELETE_DISCOM_FIELD] Form field not found with id: {field_id}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form field not found")
    
    db.delete(field)
    db.commit()
    logger.info("[DELETE_DISCOM_FIELD] Field deleted successfully")
    return


@router.get("/field-types", response_model=List[str])
def get_discom_field_types(db: Session = Depends(get_db)):
    """
    Retrieves a list of all distinct field types (e.g., 'INPUT', 'LOGIC', 'FETCHED')
    used in the DISCOM form fields.
    """
    # Fetch distinct 'type' values from the DiscomFormField table
    types = db.query(DiscomFormField.type).distinct().all()
    
    # Flatten the list of single-item tuples into a simple list of strings
    return [t[0] for t in types if t[0]]

