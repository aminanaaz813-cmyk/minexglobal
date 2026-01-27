from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"

class DepositStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class WithdrawalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class StakingStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"

class PaymentMethod(str, Enum):
    USDT = "usdt"
    BANK = "bank"

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    user_id: str
    email: EmailStr
    full_name: str
    password_hash: str
    role: UserRole = UserRole.USER
    level: int = 1
    total_investment: float = 0.0
    wallet_balance: float = 0.0
    roi_balance: float = 0.0
    commission_balance: float = 0.0
    referral_code: str
    referred_by: Optional[str] = None
    direct_referrals: List[str] = Field(default_factory=list)
    indirect_referrals: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_roi_date: Optional[datetime] = None
    is_active: bool = True

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    referral_code: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    user_id: str
    email: str
    full_name: str
    role: str
    level: int
    total_investment: float
    wallet_balance: float
    roi_balance: float
    commission_balance: float
    referral_code: str
    referred_by: Optional[str]
    direct_referrals: List[str]
    indirect_referrals: List[str]
    created_at: datetime

class MembershipPackage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    package_id: str
    level: int
    min_investment: float
    daily_roi: float
    annual_roi: float
    duration_days: int = 365
    direct_required: int = 0
    indirect_required: int = 0
    commission_lv_a: float = 0.0
    commission_lv_b: float = 0.0
    commission_lv_c: float = 0.0
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StakingPackage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    staking_id: str
    tier: int
    min_amount: float
    max_amount: float
    daily_yield: float
    total_supply: int
    remaining_supply: int
    lock_period_days: int
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Deposit(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    deposit_id: str
    user_id: str
    amount: float
    payment_method: PaymentMethod
    transaction_hash: Optional[str] = None
    screenshot_url: Optional[str] = None
    status: DepositStatus = DepositStatus.PENDING
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None
    rejection_reason: Optional[str] = None

class DepositCreate(BaseModel):
    amount: float
    payment_method: PaymentMethod
    transaction_hash: Optional[str] = None
    screenshot_url: Optional[str] = None

class Withdrawal(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    withdrawal_id: str
    user_id: str
    amount: float
    wallet_address: str
    status: WithdrawalStatus = WithdrawalStatus.PENDING
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None
    transaction_hash: Optional[str] = None
    rejection_reason: Optional[str] = None

class WithdrawalCreate(BaseModel):
    amount: float
    wallet_address: str

class Staking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    staking_entry_id: str
    user_id: str
    staking_id: str
    amount: float
    daily_yield: float
    lock_period_days: int
    start_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    end_date: datetime
    status: StakingStatus = StakingStatus.ACTIVE
    total_earned: float = 0.0
    last_yield_date: Optional[datetime] = None

class StakingCreate(BaseModel):
    staking_id: str
    amount: float
    lock_period_days: int

class Commission(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    commission_id: str
    user_id: str
    from_user_id: str
    amount: float
    commission_type: str
    percentage: float
    deposit_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ROITransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    transaction_id: str
    user_id: str
    amount: float
    roi_percentage: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdminSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    settings_id: str = "default"
    usdt_wallet_address: str = "TXyz123SampleUSDTAddress456789"
    show_qr_code: bool = True
    community_star_target: float = 28.0
    community_star_bonus_min: float = 100.0
    community_star_bonus_max: float = 1000.0
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DashboardStats(BaseModel):
    total_balance: float
    roi_balance: float
    commission_balance: float
    total_investment: float
    current_level: int
    daily_roi_percentage: float
    direct_referrals: int
    indirect_referrals: int
    total_commissions: float
    pending_withdrawals: int

class AdminDashboardStats(BaseModel):
    total_users: int
    total_deposits: float
    total_withdrawals: float
    pending_deposits: int
    pending_withdrawals: int
    total_active_stakes: int
    total_commissions_paid: float
    total_roi_paid: float
