from datetime import datetime
from src.models import Entity, User
from sqlalchemy.orm import Session
import re

def financial_year() :
    return str(datetime.now().year)


def generateOrg_code (organization_name):
    # Remove special characters (keep only letters and spaces)
    clean_name = re.sub(r'[^A-Za-z\s]', '', organization_name)
    words = clean_name.split()
    
    if len(clean_name) > 4:
        if len(words) == 1:
            org_code = words[0][:4].upper()
        elif len(words) == 2:
            org_code = words[0][:2].upper() + words[1][:2].upper()
        elif len(words) == 3:
            org_code = words[0][:1].upper() + words[1][:1].upper() + words[2][:2].upper()
        else:
            org_code = ''.join(word[0].upper() for word in words[:4])
    else:
        org_code = clean_name.upper()
        
    return org_code


def generate_registration_number(entity_type, org_code, state_code, sector_code, db: Session):
    if entity_type == "NOBE":
        organization_code = "NOBE"
    else:
        organization_code = org_code

    count_entity = db.query(Entity).count()
    serial_no = str(count_entity + 1).zfill(3)
    
    reg_no = f"RCO-{state_code}-{organization_code}-{sector_code}-{serial_no}"
    
    return reg_no


def generate_username(entity, user, db):
    if entity.entity_type == "NOBE":
        sector_code = "NOBE"
    else:
        sector_code = entity.sector_code

    org_code = entity.org_code
    role_code = user.role_code
    fy = financial_year()
    
    count_user = db.query(User).filter(
        User.username.isnot(None)
    ).count()
    
    serial_no = str(count_user + 1).zfill(3)
    final_username = f"{sector_code}-{org_code}-{role_code}-{fy}-{serial_no}"
    
    return final_username
