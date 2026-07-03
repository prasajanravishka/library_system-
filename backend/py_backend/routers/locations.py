from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_db
from auth import get_current_user

router = APIRouter()

class LocationCreate(BaseModel):
    name: str
    description: Optional[str] = None
    floor: Optional[str] = None  # Accepted but ignored as it's not in the DB schema

class LocationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    floor: Optional[str] = None

def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get('role') != 'librarian':
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

@router.get("/locations")
def get_all_locations(db = Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute("SELECT location_id, name, description, created_at FROM locations ORDER BY name ASC")
        locations = cursor.fetchall()
    return {"status": "success", "locations": locations}

@router.post("/admin/locations")
def create_location(req: LocationCreate, admin = Depends(get_admin_user), db = Depends(get_db)):
    try:
        with db.cursor() as cursor:
            # Check for duplicate names gracefully
            cursor.execute("SELECT location_id FROM locations WHERE name = %s", (req.name,))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Location name already exists")
                
            cursor.execute(
                "INSERT INTO locations (name, description) VALUES (%s, %s)",
                (req.name, req.description)
            )
            location_id = cursor.lastrowid
            
            cursor.execute("SELECT location_id, name, description, created_at FROM locations WHERE location_id = %s", (location_id,))
            location = cursor.fetchone()
            
        db.commit()
        return {"status": "success", "message": "Location created successfully", "location": location}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/admin/locations/{location_id}")
def update_location(location_id: int, req: LocationUpdate, admin = Depends(get_admin_user), db = Depends(get_db)):
    updates = []
    params = []
    
    if req.name is not None:
        updates.append("name = %s")
        params.append(req.name)
    if req.description is not None:
        updates.append("description = %s")
        params.append(req.description)
        
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    params.append(location_id)
    try:
        with db.cursor() as cursor:
            # Check for duplicate name if updating name
            if req.name is not None:
                cursor.execute("SELECT location_id FROM locations WHERE name = %s AND location_id != %s", (req.name, location_id))
                if cursor.fetchone():
                    raise HTTPException(status_code=400, detail="Location name already exists")
                    
            cursor.execute(f"UPDATE locations SET {', '.join(updates)} WHERE location_id = %s", tuple(params))
            
            cursor.execute("SELECT location_id, name, description, created_at FROM locations WHERE location_id = %s", (location_id,))
            location = cursor.fetchone()
            
            if not location:
                raise HTTPException(status_code=404, detail="Location not found")
                
        db.commit()
        return {"status": "success", "message": "Location updated successfully", "location": location}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/admin/locations/{location_id}")
def delete_location(location_id: int, admin = Depends(get_admin_user), db = Depends(get_db)):
    try:
        with db.cursor() as cursor:
            cursor.execute("DELETE FROM locations WHERE location_id = %s", (location_id,))
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Location not found")
        db.commit()
        return {"status": "success", "message": "Location deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
