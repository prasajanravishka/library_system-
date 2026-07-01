from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from database import get_db
from auth import get_current_user

router = APIRouter()

# ── Settings ──

class SettingsUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    push_notifications: Optional[int] = None
    email_notifications: Optional[int] = None
    theme_preference: Optional[str] = None

@router.get("/settings")
def get_settings(current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    user_id = current_user['user_id']
    with db.cursor() as cursor:
        cursor.execute("SELECT push_notifications, email_notifications, theme_preference FROM user_settings WHERE user_id = %s", (user_id,))
        settings = cursor.fetchone()
        
        if not settings:
            cursor.execute("INSERT INTO user_settings (user_id) VALUES (%s)", (user_id,))
            db.commit()
            settings = {
                'push_notifications': 1,
                'email_notifications': 1,
                'theme_preference': 'system'
            }
            
        settings['push_notifications'] = bool(settings['push_notifications'])
        settings['email_notifications'] = bool(settings['email_notifications'])
        
    return {"status": "success", "settings": settings}

@router.put("/settings")
def update_settings(req: SettingsUpdate, current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    user_id = current_user['user_id']
    try:
        with db.cursor() as cursor:
            # Update users table if needed
            if req.full_name or req.email:
                updates = []
                params = []
                if req.full_name:
                    updates.append("full_name = %s")
                    params.append(req.full_name)
                if req.email:
                    cursor.execute("SELECT user_id FROM users WHERE email = %s AND user_id != %s", (req.email, user_id))
                    if cursor.fetchone():
                        raise HTTPException(status_code=409, detail="Email is already in use")
                    updates.append("email = %s")
                    params.append(req.email)
                
                if updates:
                    params.append(user_id)
                    cursor.execute(f"UPDATE users SET {', '.join(updates)} WHERE user_id = %s", tuple(params))
            
            # Update settings table
            cursor.execute("SELECT push_notifications, email_notifications, theme_preference FROM user_settings WHERE user_id = %s", (user_id,))
            current_settings = cursor.fetchone() or {'push_notifications': 1, 'email_notifications': 1, 'theme_preference': 'system'}
            
            push = req.push_notifications if req.push_notifications is not None else current_settings['push_notifications']
            email = req.email_notifications if req.email_notifications is not None else current_settings['email_notifications']
            theme = req.theme_preference if req.theme_preference is not None else current_settings['theme_preference']
            
            cursor.execute(
                """INSERT INTO user_settings (user_id, push_notifications, email_notifications, theme_preference)
                   VALUES (%s, %s, %s, %s)
                   ON DUPLICATE KEY UPDATE 
                   push_notifications = VALUES(push_notifications), 
                   email_notifications = VALUES(email_notifications), 
                   theme_preference = VALUES(theme_preference)""",
                (user_id, push, email, theme)
            )
        db.commit()
        return {"status": "success", "message": "Settings updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ── Notifications ──

class NotificationAction(BaseModel):
    notification_id: Optional[int] = None

@router.get("/notifications")
def get_notifications(current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    user_id = current_user['user_id']
    with db.cursor() as cursor:
        cursor.execute(
            """SELECT notification_id, title, message, type, is_read, created_at
               FROM notifications WHERE user_id = %s ORDER BY created_at DESC""",
            (user_id,)
        )
        notifications = cursor.fetchall()
        for n in notifications:
            n['is_read'] = bool(n['is_read'])
    return {"status": "success", "notifications": notifications}

@router.put("/notifications/read")
def mark_notification_read(req: NotificationAction, current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    user_id = current_user['user_id']
    with db.cursor() as cursor:
        if req.notification_id:
            cursor.execute("UPDATE notifications SET is_read = TRUE WHERE notification_id = %s AND user_id = %s", (req.notification_id, user_id))
            msg = "Notification marked as read"
        else:
            cursor.execute("UPDATE notifications SET is_read = TRUE WHERE user_id = %s", (user_id,))
            msg = "All notifications marked as read"
    db.commit()
    return {"status": "success", "message": msg}

@router.delete("/notifications/{notification_id}")
def delete_notification(notification_id: int, current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    user_id = current_user['user_id']
    with db.cursor() as cursor:
        cursor.execute("DELETE FROM notifications WHERE notification_id = %s AND user_id = %s", (notification_id, user_id))
    db.commit()
    return {"status": "success", "message": "Notification deleted"}

# ── Support ──

class SupportTicket(BaseModel):
    subject: str
    message: str

@router.get("/support/tickets")
def get_tickets(current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    user_id = current_user['user_id']
    with db.cursor() as cursor:
        cursor.execute(
            """SELECT ticket_id, subject, message, status, created_at, updated_at
               FROM support_tickets WHERE user_id = %s ORDER BY created_at DESC""",
            (user_id,)
        )
        tickets = cursor.fetchall()
    return {"status": "success", "tickets": tickets}

@router.post("/support/tickets")
def create_ticket(req: SupportTicket, current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    user_id = current_user['user_id']
    with db.cursor() as cursor:
        cursor.execute(
            "INSERT INTO support_tickets (user_id, subject, message) VALUES (%s, %s, %s)",
            (user_id, req.subject, req.message)
        )
        ticket_id = cursor.lastrowid
    db.commit()
    return {"status": "success", "message": "Support ticket created successfully", "ticket_id": ticket_id}
