
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session 
from typing import List
from src.database import get_db
from src.models import CPPFormSection, CPPFormField
from src.schemas.cpp_form import (
    CPPFormSectionBase, CPPFormSectionResponse,
    CPPFormBase, CPPFormResponse,CPPFormCreate
  )
from src.database import get_db
from typing import  List

import logging
logger = logging.getLogger(__name__)

router = APIRouter( tags=["CPP Form"])

# ----------------- Section APIs -----------------

@router.post("/cpp/sections", response_model=CPPFormSectionResponse, status_code=201)
def create_section(section: CPPFormSectionBase, db: Session = Depends(get_db)):
    existing = db.query(CPPFormSection).filter(CPPFormSection.title == section.title).first()
    if existing:
        logger.warning(f"[CREATE_CPP_SECTION] Section already exists with title: {section.title}")
        raise HTTPException(status_code=400, detail="Section with this title already exists.")
    
    new_section = CPPFormSection(**section.dict())
    db.add(new_section)
    db.commit()
    db.refresh(new_section)
    logger.info("[CREATE_CPP_SECTION] Section created successfully")
    return new_section

@router.get("/cpp/sections", response_model=List[CPPFormSectionResponse])
def get_all_sections(db: Session = Depends(get_db)):
    return db.query(CPPFormSection).all()


# ----------------- Field APIs -----------------

@router.post("/cpp/fields", response_model=CPPFormResponse, status_code=201)
def create_field(field: CPPFormBase, db: Session = Depends(get_db)):
    # Check if section exists
    section = db.query(CPPFormSection).filter(CPPFormSection.id == field.section_id).first()
    if not section:
        logger.warning(f"[CREATE_CPP_FIELD] Section not found with id: {field.section_id}")
        raise HTTPException(status_code=404, detail="Section not found.")

    # Unique acronym check
    if db.query(CPPFormField).filter(CPPFormField.acronym == field.acronym).first():
        logger.warning(f"[CREATE_CPP_FIELD] Acronym already exists: {field.acronym}")
        raise HTTPException(status_code=400, detail="Acronym already exists.")

    # Serial uniqueness check within section
    if db.query(CPPFormField).filter(CPPFormField.section_id == field.section_id, CPPFormField.serial == field.serial).first():
        logger.warning(f"[CREATE_CPP_FIELD] Serial already exists in this section: {field.serial}")
        raise HTTPException(status_code=400, detail="Serial already exists in this section.")

    new_field = CPPFormField(**field.dict())
    db.add(new_field)
    db.commit()
    db.refresh(new_field)
    logger.info("[CREATE_CPP_FIELD] Field created successfully")
    return new_field

@router.get("/cpp/fields", response_model=List[CPPFormResponse])
def get_all_fields(db: Session = Depends(get_db)):
    return db.query(CPPFormField).order_by(CPPFormField.section_id, CPPFormField.serial).all()


@router.get("/cpp/fields/{field_id}", response_model=CPPFormResponse)
def get_cpp_field(field_id: int, db: Session = Depends(get_db)):
    """
    Retrieves a single CPP form field by its unique primary key ID.
    """
    field = db.query(CPPFormField).filter(CPPFormField.id == field_id).first()
    if not field:
        logger.warning(f"[GET_CPP_FIELD] Form field not found with id: {field_id}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form field not found")
    return field





@router.put("/cpp/fields/{field_id}", response_model=CPPFormResponse)
def update_discom_field(field_id: int, field_data: CPPFormCreate, db: Session = Depends(get_db)):
    """
    Updates the details of an existing DISCOM form field.
    It checks for uniqueness of the acronym and the serial number within its section.
    """
    # Fetch the existing field by its primary key ID
    field = db.query(CPPFormField).filter(CPPFormField.id == field_id).first()
    if not field:
        logger.warning(f"[UPDATE_CPP_FIELD] Form field not found with id: {field_id}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form field not found")

    # Check for acronym uniqueness if it has been changed
    if field_data.acronym != field.acronym:
        acronym_exists = db.query(CPPFormField).filter(CPPFormField.acronym == field_data.acronym).first()
        if acronym_exists:
            logger.warning(f"[UPDATE_CPP_FIELD] Acronym already in use: {field_data.acronym}")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This acronym is already in use.")

    # Check for serial uniqueness within the new section if serial or section has changed
    if field_data.serial != field.serial or field_data.section_id != field.section_id:
        serial_exists = db.query(CPPFormField).filter(
            CPPFormField.section_id == field_data.section_id,
            CPPFormField.serial == field_data.serial
        ).first()
        if serial_exists:
            logger.warning(f"[UPDATE_CPP_FIELD] Serial already in use for this section: {field_data.serial}")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This serial number is already in use for this section.")

    # Update the field object with the new data from the request body
    for key, value in field_data.dict().items():
        setattr(field, key, value)
        
    db.commit()
    db.refresh(field)
    logger.info("[UPDATE_CPP_FIELD] Field updated successfully")
    return CPPFormResponse.from_orm(field)


@router.delete("/cpp/fields/{field_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_discom_field(field_id: int, db: Session = Depends(get_db)):
    """
    Deletes a DISCOM form field by its unique primary key ID.
    """
    field = db.query(CPPFormField).filter(CPPFormField.id == field_id).first()
    if not field:
        logger.warning(f"[DELETE_CPP_FIELD] Form field not found with id: {field_id}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form field not found")
    
    db.delete(field)
    db.commit()
    logger.info("[DELETE_CPP_FIELD] Field deleted successfully")
    return


@router.get("/cpp/field-types", response_model=List[str])
def get_discom_field_types(db: Session = Depends(get_db)):
    """
    Retrieves a list of all distinct field types (e.g., 'INPUT', 'LOGIC', 'FETCHED')
    used in the DISCOM form fields.
    """
    # Fetch distinct 'type' values from the CPPFormField table
    types = db.query(CPPFormField.type).distinct().all()
    
    # Flatten the list of single-item tuples into a simple list of strings
    return [t[0] for t in types if t[0]]