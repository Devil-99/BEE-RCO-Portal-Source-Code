from fastapi import Request, HTTPException, status

def is_admin(request: Request) -> bool:
    return request.state.role_code == "ADM"

def require_admin(request: Request):
    if request.state.role_code != "ADM":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admins only"
        )
