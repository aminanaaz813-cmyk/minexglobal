from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import Optional, List
import uuid
from datetime import datetime, timezone, timedelta
import base64

from models import (
    User, UserCreate, UserLogin, UserResponse, UserRole,
    MembershipPackage, StakingPackage, Deposit, DepositCreate, DepositStatus,
    Withdrawal, WithdrawalCreate, WithdrawalStatus, Staking, StakingCreate, StakingStatus,
    Commission, ROITransaction, AdminSettings, DashboardStats, AdminDashboardStats,
    PaymentMethod
)
from auth import verify_password, get_password_hash, create_access_token, decode_access_token

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def get_current_user(authorization: Optional[str] = Header(None)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"user_id": payload.get("user_id")}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user)

async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

def generate_referral_code() -> str:
    return str(uuid.uuid4())[:8].upper()

async def calculate_level(user_id: str, total_investment: float) -> int:
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        return 1
    
    direct_count = len(user.get("direct_referrals", []))
    indirect_count = len(user.get("indirect_referrals", []))
    
    packages = await db.membership_packages.find({"is_active": True}, {"_id": 0}).sort("level", -1).to_list(10)
    
    for pkg in packages:
        if (total_investment >= pkg["min_investment"] and 
            direct_count >= pkg.get("direct_required", 0) and 
            indirect_count >= pkg.get("indirect_required", 0)):
            return pkg["level"]
    
    return 1

async def distribute_commissions(deposit_id: str, user_id: str, amount: float):
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user or not user.get("referred_by"):
        return
    
    upline_levels = []
    current_ref = user.get("referred_by")
    
    for _ in range(3):
        if not current_ref:
            break
        ref_user = await db.users.find_one({"user_id": current_ref}, {"_id": 0})
        if ref_user:
            upline_levels.append(ref_user)
            current_ref = ref_user.get("referred_by")
        else:
            break
    
    commission_types = ["lv_a", "lv_b", "lv_c"]
    
    for idx, upline in enumerate(upline_levels):
        if idx >= 3:
            break
        
        upline_level = upline.get("level", 1)
        package = await db.membership_packages.find_one({"level": upline_level, "is_active": True}, {"_id": 0})
        
        if not package:
            continue
        
        commission_key = f"commission_{commission_types[idx]}"
        commission_percentage = package.get(commission_key, 0.0)
        
        if commission_percentage > 0:
            commission_amount = amount * (commission_percentage / 100)
            
            commission_doc = {
                "commission_id": str(uuid.uuid4()),
                "user_id": upline["user_id"],
                "from_user_id": user_id,
                "amount": commission_amount,
                "commission_type": commission_types[idx].upper(),
                "percentage": commission_percentage,
                "deposit_id": deposit_id,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.commissions.insert_one(commission_doc)
            
            await db.users.update_one(
                {"user_id": upline["user_id"]},
                {"$inc": {"commission_balance": commission_amount, "wallet_balance": commission_amount}}
            )

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    referred_by_id = None
    if user_data.referral_code:
        referrer = await db.users.find_one({"referral_code": user_data.referral_code}, {"_id": 0})
        if referrer:
            referred_by_id = referrer["user_id"]
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "full_name": user_data.full_name,
        "password_hash": get_password_hash(user_data.password),
        "role": UserRole.USER,
        "level": 1,
        "total_investment": 0.0,
        "wallet_balance": 0.0,
        "roi_balance": 0.0,
        "commission_balance": 0.0,
        "referral_code": generate_referral_code(),
        "referred_by": referred_by_id,
        "direct_referrals": [],
        "indirect_referrals": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_roi_date": None,
        "is_active": True
    }
    
    await db.users.insert_one(user_doc)
    
    # Remove MongoDB ObjectId that gets added after insert
    user_doc.pop("_id", None)
    
    if referred_by_id:
        await db.users.update_one(
            {"user_id": referred_by_id},
            {"$push": {"direct_referrals": user_id}}
        )
        
        referrer = await db.users.find_one({"user_id": referred_by_id}, {"_id": 0})
        if referrer and referrer.get("referred_by"):
            await db.users.update_one(
                {"user_id": referrer["referred_by"]},
                {"$push": {"indirect_referrals": user_id}}
            )
    
    token = create_access_token({"user_id": user_id, "email": user_data.email})
    user_doc.pop("password_hash")
    
    # Convert enum and datetime to JSON serializable format
    user_doc["role"] = user_doc["role"].value
    user_doc["created_at"] = user_doc["created_at"]
    
    return {"token": token, "user": user_doc}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"user_id": user["user_id"], "email": user["email"]})
    user.pop("password_hash")
    
    # Ensure proper serialization
    if "role" in user and hasattr(user["role"], 'value'):
        user["role"] = user["role"].value
    
    return {"token": token, "user": user}

@api_router.get("/user/profile", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.get("/user/dashboard")
async def get_dashboard(current_user: User = Depends(get_current_user)):
    package = await db.membership_packages.find_one({"level": current_user.level, "is_active": True}, {"_id": 0})
    daily_roi = package.get("daily_roi", 0.0) if package else 0.0
    
    total_commissions = 0.0
    async for comm in db.commissions.find({"user_id": current_user.user_id}, {"_id": 0}):
        total_commissions += comm.get("amount", 0.0)
    
    pending_withdrawals = await db.withdrawals.count_documents({"user_id": current_user.user_id, "status": WithdrawalStatus.PENDING})
    
    return DashboardStats(
        total_balance=current_user.wallet_balance,
        roi_balance=current_user.roi_balance,
        commission_balance=current_user.commission_balance,
        total_investment=current_user.total_investment,
        current_level=current_user.level,
        daily_roi_percentage=daily_roi,
        direct_referrals=len(current_user.direct_referrals),
        indirect_referrals=len(current_user.indirect_referrals),
        total_commissions=total_commissions,
        pending_withdrawals=pending_withdrawals
    )

@api_router.get("/user/team")
async def get_team(current_user: User = Depends(get_current_user)):
    direct_users = []
    for user_id in current_user.direct_referrals:
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
        if user:
            direct_users.append(user)
    
    indirect_users = []
    for user_id in current_user.indirect_referrals:
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
        if user:
            indirect_users.append(user)
    
    return {"direct": direct_users, "indirect": indirect_users}

@api_router.post("/deposits")
async def create_deposit(deposit_data: DepositCreate, current_user: User = Depends(get_current_user)):
    deposit_doc = {
        "deposit_id": str(uuid.uuid4()),
        "user_id": current_user.user_id,
        "amount": deposit_data.amount,
        "payment_method": deposit_data.payment_method,
        "transaction_hash": deposit_data.transaction_hash,
        "screenshot_url": deposit_data.screenshot_url,
        "status": DepositStatus.PENDING,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "approved_at": None,
        "approved_by": None,
        "rejection_reason": None
    }
    
    await db.deposits.insert_one(deposit_doc)
    
    # Remove MongoDB ObjectId that gets added after insert
    deposit_doc.pop("_id", None)
    
    # Convert enum to string for JSON serialization
    deposit_doc["status"] = deposit_doc["status"].value
    deposit_doc["payment_method"] = deposit_doc["payment_method"].value
    
    return deposit_doc

@api_router.get("/deposits")
async def get_deposits(current_user: User = Depends(get_current_user)):
    deposits = await db.deposits.find({"user_id": current_user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return deposits

@api_router.post("/deposits/{deposit_id}/upload-screenshot")
async def upload_screenshot(deposit_id: str, file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    deposit = await db.deposits.find_one({"deposit_id": deposit_id, "user_id": current_user.user_id}, {"_id": 0})
    if not deposit:
        raise HTTPException(status_code=404, detail="Deposit not found")
    
    contents = await file.read()
    screenshot_base64 = base64.b64encode(contents).decode('utf-8')
    screenshot_url = f"data:image/png;base64,{screenshot_base64}"
    
    await db.deposits.update_one(
        {"deposit_id": deposit_id},
        {"$set": {"screenshot_url": screenshot_url}}
    )
    
    return {"message": "Screenshot uploaded", "screenshot_url": screenshot_url}

@api_router.post("/withdrawals")
async def create_withdrawal(withdrawal_data: WithdrawalCreate, current_user: User = Depends(get_current_user)):
    if withdrawal_data.amount > current_user.wallet_balance:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    withdrawal_doc = {
        "withdrawal_id": str(uuid.uuid4()),
        "user_id": current_user.user_id,
        "amount": withdrawal_data.amount,
        "wallet_address": withdrawal_data.wallet_address,
        "status": WithdrawalStatus.PENDING,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "approved_at": None,
        "approved_by": None,
        "transaction_hash": None,
        "rejection_reason": None
    }
    
    await db.withdrawals.insert_one(withdrawal_doc)
    
    # Remove MongoDB ObjectId that gets added after insert
    withdrawal_doc.pop("_id", None)
    
    # Convert enum to string for JSON serialization
    withdrawal_doc["status"] = withdrawal_doc["status"].value
    
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$inc": {"wallet_balance": -withdrawal_data.amount}}
    )
    
    return withdrawal_doc

@api_router.get("/withdrawals")
async def get_withdrawals(current_user: User = Depends(get_current_user)):
    withdrawals = await db.withdrawals.find({"user_id": current_user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return withdrawals

@api_router.get("/staking/packages")
async def get_staking_packages():
    packages = await db.staking_packages.find({"is_active": True}, {"_id": 0}).sort("tier", 1).to_list(10)
    return packages

@api_router.post("/staking")
async def create_staking(staking_data: StakingCreate, current_user: User = Depends(get_current_user)):
    package = await db.staking_packages.find_one({"staking_id": staking_data.staking_id, "is_active": True}, {"_id": 0})
    if not package:
        raise HTTPException(status_code=404, detail="Staking package not found")
    
    if staking_data.amount < package["min_amount"] or staking_data.amount > package["max_amount"]:
        raise HTTPException(status_code=400, detail="Amount out of range")
    
    if package["remaining_supply"] <= 0:
        raise HTTPException(status_code=400, detail="Package sold out")
    
    if current_user.wallet_balance < staking_data.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    end_date = datetime.now(timezone.utc) + timedelta(days=staking_data.lock_period_days)
    
    staking_doc = {
        "staking_entry_id": str(uuid.uuid4()),
        "user_id": current_user.user_id,
        "staking_id": staking_data.staking_id,
        "amount": staking_data.amount,
        "daily_yield": package["daily_yield"],
        "lock_period_days": staking_data.lock_period_days,
        "start_date": datetime.now(timezone.utc).isoformat(),
        "end_date": end_date.isoformat(),
        "status": StakingStatus.ACTIVE,
        "total_earned": 0.0,
        "last_yield_date": None
    }
    
    await db.staking.insert_one(staking_doc)
    
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$inc": {"wallet_balance": -staking_data.amount}}
    )
    
    await db.staking_packages.update_one(
        {"staking_id": staking_data.staking_id},
        {"$inc": {"remaining_supply": -1}}
    )
    
    return staking_doc

@api_router.get("/staking")
async def get_user_staking(current_user: User = Depends(get_current_user)):
    stakes = await db.staking.find({"user_id": current_user.user_id}, {"_id": 0}).sort("start_date", -1).to_list(100)
    return stakes

@api_router.get("/commissions")
async def get_commissions(current_user: User = Depends(get_current_user)):
    commissions = await db.commissions.find({"user_id": current_user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    lv_a_total = sum(c["amount"] for c in commissions if c.get("commission_type") == "LV_A")
    lv_b_total = sum(c["amount"] for c in commissions if c.get("commission_type") == "LV_B")
    lv_c_total = sum(c["amount"] for c in commissions if c.get("commission_type") == "LV_C")
    
    return {
        "commissions": commissions,
        "summary": {
            "lv_a": lv_a_total,
            "lv_b": lv_b_total,
            "lv_c": lv_c_total,
            "total": lv_a_total + lv_b_total + lv_c_total
        }
    }

@api_router.get("/membership/packages")
async def get_membership_packages():
    packages = await db.membership_packages.find({"is_active": True}, {"_id": 0}).sort("level", 1).to_list(10)
    return packages

@api_router.get("/settings")
async def get_settings():
    settings = await db.admin_settings.find_one({"settings_id": "default"}, {"_id": 0})
    if not settings:
        default_settings = {
            "settings_id": "default",
            "usdt_wallet_address": "TXyz123SampleUSDTAddress456789",
            "community_star_target": 28.0,
            "community_star_bonus_min": 100.0,
            "community_star_bonus_max": 1000.0,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.admin_settings.insert_one(default_settings)
        return default_settings
    return settings

@api_router.get("/admin/dashboard")
async def get_admin_dashboard(admin: User = Depends(get_admin_user)):
    total_users = await db.users.count_documents({})
    
    deposits = await db.deposits.find({"status": DepositStatus.APPROVED}, {"_id": 0}).to_list(10000)
    total_deposits = sum(d.get("amount", 0) for d in deposits)
    
    withdrawals = await db.withdrawals.find({"status": WithdrawalStatus.APPROVED}, {"_id": 0}).to_list(10000)
    total_withdrawals = sum(w.get("amount", 0) for w in withdrawals)
    
    pending_deposits = await db.deposits.count_documents({"status": DepositStatus.PENDING})
    pending_withdrawals = await db.withdrawals.count_documents({"status": WithdrawalStatus.PENDING})
    
    total_active_stakes = await db.staking.count_documents({"status": StakingStatus.ACTIVE})
    
    commissions = await db.commissions.find({}, {"_id": 0}).to_list(10000)
    total_commissions_paid = sum(c.get("amount", 0) for c in commissions)
    
    roi_transactions = await db.roi_transactions.find({}, {"_id": 0}).to_list(10000)
    total_roi_paid = sum(r.get("amount", 0) for r in roi_transactions)
    
    return AdminDashboardStats(
        total_users=total_users,
        total_deposits=total_deposits,
        total_withdrawals=total_withdrawals,
        pending_deposits=pending_deposits,
        pending_withdrawals=pending_withdrawals,
        total_active_stakes=total_active_stakes,
        total_commissions_paid=total_commissions_paid,
        total_roi_paid=total_roi_paid
    )

@api_router.get("/admin/users")
async def get_all_users(admin: User = Depends(get_admin_user)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(1000)
    return users

@api_router.get("/admin/deposits")
async def get_all_deposits(admin: User = Depends(get_admin_user)):
    deposits = await db.deposits.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Enrich deposits with user information
    enriched_deposits = []
    for deposit in deposits:
        user = await db.users.find_one({"user_id": deposit["user_id"]}, {"_id": 0, "email": 1, "full_name": 1})
        deposit_with_user = {
            **deposit,
            "user_email": user.get("email") if user else "Unknown",
            "user_name": user.get("full_name") if user else "Unknown"
        }
        enriched_deposits.append(deposit_with_user)
    
    return enriched_deposits

@api_router.post("/admin/deposits/{deposit_id}/approve")
async def approve_deposit(deposit_id: str, admin: User = Depends(get_admin_user)):
    deposit = await db.deposits.find_one({"deposit_id": deposit_id}, {"_id": 0})
    if not deposit:
        raise HTTPException(status_code=404, detail="Deposit not found")
    
    if deposit["status"] != DepositStatus.PENDING:
        raise HTTPException(status_code=400, detail="Deposit already processed")
    
    await db.deposits.update_one(
        {"deposit_id": deposit_id},
        {"$set": {
            "status": DepositStatus.APPROVED,
            "approved_at": datetime.now(timezone.utc).isoformat(),
            "approved_by": admin.user_id
        }}
    )
    
    amount = deposit["amount"]
    user_id = deposit["user_id"]
    
    await db.users.update_one(
        {"user_id": user_id},
        {"$inc": {
            "wallet_balance": amount,
            "total_investment": amount
        }}
    )
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    new_level = await calculate_level(user_id, user["total_investment"])
    if new_level != user["level"]:
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"level": new_level}}
        )
    
    await distribute_commissions(deposit_id, user_id, amount)
    
    return {"message": "Deposit approved and commissions distributed"}

@api_router.post("/admin/deposits/{deposit_id}/reject")
async def reject_deposit(deposit_id: str, reason: str, admin: User = Depends(get_admin_user)):
    deposit = await db.deposits.find_one({"deposit_id": deposit_id}, {"_id": 0})
    if not deposit:
        raise HTTPException(status_code=404, detail="Deposit not found")
    
    await db.deposits.update_one(
        {"deposit_id": deposit_id},
        {"$set": {
            "status": DepositStatus.REJECTED,
            "rejection_reason": reason,
            "approved_by": admin.user_id
        }}
    )
    
    return {"message": "Deposit rejected"}

@api_router.get("/admin/withdrawals")
async def get_all_withdrawals(admin: User = Depends(get_admin_user)):
    withdrawals = await db.withdrawals.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return withdrawals

@api_router.post("/admin/withdrawals/{withdrawal_id}/approve")
async def approve_withdrawal(withdrawal_id: str, transaction_hash: str, admin: User = Depends(get_admin_user)):
    withdrawal = await db.withdrawals.find_one({"withdrawal_id": withdrawal_id}, {"_id": 0})
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Withdrawal not found")
    
    await db.withdrawals.update_one(
        {"withdrawal_id": withdrawal_id},
        {"$set": {
            "status": WithdrawalStatus.APPROVED,
            "approved_at": datetime.now(timezone.utc).isoformat(),
            "approved_by": admin.user_id,
            "transaction_hash": transaction_hash
        }}
    )
    
    return {"message": "Withdrawal approved"}

@api_router.post("/admin/withdrawals/{withdrawal_id}/reject")
async def reject_withdrawal(withdrawal_id: str, reason: str, admin: User = Depends(get_admin_user)):
    withdrawal = await db.withdrawals.find_one({"withdrawal_id": withdrawal_id}, {"_id": 0})
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Withdrawal not found")
    
    await db.withdrawals.update_one(
        {"withdrawal_id": withdrawal_id},
        {"$set": {
            "status": WithdrawalStatus.REJECTED,
            "rejection_reason": reason,
            "approved_by": admin.user_id
        }}
    )
    
    await db.users.update_one(
        {"user_id": withdrawal["user_id"]},
        {"$inc": {"wallet_balance": withdrawal["amount"]}}
    )
    
    return {"message": "Withdrawal rejected and balance restored"}

@api_router.post("/admin/membership/packages")
async def create_membership_package(package: MembershipPackage, admin: User = Depends(get_admin_user)):
    package_dict = package.model_dump()
    package_dict["created_at"] = package_dict["created_at"].isoformat()
    await db.membership_packages.insert_one(package_dict)
    return package_dict

@api_router.put("/admin/membership/packages/{package_id}")
async def update_membership_package(package_id: str, package: MembershipPackage, admin: User = Depends(get_admin_user)):
    package_dict = package.model_dump()
    package_dict["created_at"] = package_dict["created_at"].isoformat()
    await db.membership_packages.update_one({"package_id": package_id}, {"$set": package_dict})
    return package_dict

@api_router.post("/admin/staking/packages")
async def create_staking_package(package: StakingPackage, admin: User = Depends(get_admin_user)):
    package_dict = package.model_dump()
    package_dict["created_at"] = package_dict["created_at"].isoformat()
    await db.staking_packages.insert_one(package_dict)
    return package_dict

@api_router.put("/admin/staking/packages/{staking_id}")
async def update_staking_package(staking_id: str, package: StakingPackage, admin: User = Depends(get_admin_user)):
    package_dict = package.model_dump()
    package_dict["created_at"] = package_dict["created_at"].isoformat()
    await db.staking_packages.update_one({"staking_id": staking_id}, {"$set": package_dict})
    return package_dict

@api_router.put("/admin/settings")
async def update_settings(settings: AdminSettings, admin: User = Depends(get_admin_user)):
    settings_dict = settings.model_dump()
    settings_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.admin_settings.update_one(
        {"settings_id": "default"},
        {"$set": settings_dict},
        upsert=True
    )
    return settings_dict

@api_router.post("/admin/calculate-roi")
async def calculate_daily_roi(admin: User = Depends(get_admin_user)):
    users = await db.users.find({"is_active": True, "total_investment": {"$gt": 0}}, {"_id": 0}).to_list(10000)
    
    roi_count = 0
    for user in users:
        package = await db.membership_packages.find_one({"level": user["level"], "is_active": True}, {"_id": 0})
        if not package:
            continue
        
        daily_roi_percentage = package.get("daily_roi", 0.0)
        roi_amount = user["total_investment"] * (daily_roi_percentage / 100)
        
        if roi_amount > 0:
            roi_doc = {
                "transaction_id": str(uuid.uuid4()),
                "user_id": user["user_id"],
                "amount": roi_amount,
                "roi_percentage": daily_roi_percentage,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.roi_transactions.insert_one(roi_doc)
            
            await db.users.update_one(
                {"user_id": user["user_id"]},
                {"$inc": {
                    "roi_balance": roi_amount,
                    "wallet_balance": roi_amount
                },
                "$set": {
                    "last_roi_date": datetime.now(timezone.utc).isoformat()
                }}
            )
            roi_count += 1
    
    return {"message": f"ROI calculated for {roi_count} users", "total_users_processed": roi_count}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting application...")
    
    admin_exists = await db.users.find_one({"email": "admin@minex.online"}, {"_id": 0})
    if not admin_exists:
        admin_doc = {
            "user_id": str(uuid.uuid4()),
            "email": "admin@minex.online",
            "full_name": "Admin",
            "password_hash": get_password_hash("password"),
            "role": UserRole.ADMIN,
            "level": 6,
            "total_investment": 0.0,
            "wallet_balance": 0.0,
            "roi_balance": 0.0,
            "commission_balance": 0.0,
            "referral_code": "ADMIN001",
            "referred_by": None,
            "direct_referrals": [],
            "indirect_referrals": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_roi_date": None,
            "is_active": True
        }
        await db.users.insert_one(admin_doc)
        logger.info("Admin user created")
    
    membership_count = await db.membership_packages.count_documents({})
    if membership_count == 0:
        membership_packages = [
            {"package_id": str(uuid.uuid4()), "level": 1, "min_investment": 50, "daily_roi": 1.8, "annual_roi": 657, "duration_days": 365, "direct_required": 0, "indirect_required": 0, "commission_lv_a": 0, "commission_lv_b": 0, "commission_lv_c": 0, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"package_id": str(uuid.uuid4()), "level": 2, "min_investment": 500, "daily_roi": 2.1, "annual_roi": 766.5, "duration_days": 365, "direct_required": 3, "indirect_required": 4, "commission_lv_a": 12, "commission_lv_b": 5, "commission_lv_c": 2, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"package_id": str(uuid.uuid4()), "level": 3, "min_investment": 2000, "daily_roi": 2.5, "annual_roi": 912.5, "duration_days": 365, "direct_required": 15, "indirect_required": 30, "commission_lv_a": 13, "commission_lv_b": 6, "commission_lv_c": 3, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"package_id": str(uuid.uuid4()), "level": 4, "min_investment": 5000, "daily_roi": 3.1, "annual_roi": 1131.5, "duration_days": 365, "direct_required": 30, "indirect_required": 60, "commission_lv_a": 15, "commission_lv_b": 7, "commission_lv_c": 5, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"package_id": str(uuid.uuid4()), "level": 5, "min_investment": 10000, "daily_roi": 3.7, "annual_roi": 1350.5, "duration_days": 365, "direct_required": 50, "indirect_required": 100, "commission_lv_a": 16, "commission_lv_b": 8, "commission_lv_c": 7, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"package_id": str(uuid.uuid4()), "level": 6, "min_investment": 30000, "daily_roi": 4.1, "annual_roi": 1496.5, "duration_days": 365, "direct_required": 100, "indirect_required": 200, "commission_lv_a": 18, "commission_lv_b": 9, "commission_lv_c": 8, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()}
        ]
        await db.membership_packages.insert_many(membership_packages)
        logger.info("Membership packages initialized")
    
    staking_count = await db.staking_packages.count_documents({})
    if staking_count == 0:
        staking_packages = [
            {"staking_id": str(uuid.uuid4()), "tier": 1, "min_amount": 200, "max_amount": 499, "daily_yield": 1.0, "total_supply": 100000, "remaining_supply": 100000, "lock_period_days": 30, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"staking_id": str(uuid.uuid4()), "tier": 2, "min_amount": 500, "max_amount": 799, "daily_yield": 1.3, "total_supply": 50000, "remaining_supply": 50000, "lock_period_days": 30, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"staking_id": str(uuid.uuid4()), "tier": 3, "min_amount": 800, "max_amount": 1200, "daily_yield": 1.5, "total_supply": 50000, "remaining_supply": 50000, "lock_period_days": 30, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()}
        ]
        await db.staking_packages.insert_many(staking_packages)
        logger.info("Staking packages initialized")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
