"""
ROI Scheduler Service for MINEX GLOBAL Platform
Automatically distributes daily ROI to all active stakers
"""
import logging
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid

logger = logging.getLogger(__name__)

class ROIScheduler:
    def __init__(self):
        self.db = None
        self.email_service = None
        self.is_running = False
        self.last_run = None
        self.next_run = None
        self.run_hour = 0  # Default: Run at midnight UTC
        self.run_minute = 0
        
    def set_dependencies(self, db, email_service):
        """Set database and email service references"""
        self.db = db
        self.email_service = email_service
        
    def set_schedule(self, hour: int = 0, minute: int = 0):
        """Set the daily run time (UTC)"""
        self.run_hour = hour
        self.run_minute = minute
        self._calculate_next_run()
        
    def _calculate_next_run(self):
        """Calculate the next scheduled run time"""
        now = datetime.now(timezone.utc)
        next_run = now.replace(hour=self.run_hour, minute=self.run_minute, second=0, microsecond=0)
        
        # If time has passed today, schedule for tomorrow
        if next_run <= now:
            next_run += timedelta(days=1)
        
        self.next_run = next_run
        return next_run
    
    async def distribute_daily_roi(self) -> dict:
        """
        Distribute daily ROI to all active stakers
        Returns summary of the distribution
        """
        if not self.db:
            logger.error("Database not configured for ROI scheduler")
            return {"error": "Database not configured"}
        
        logger.info("Starting automatic daily ROI distribution...")
        self.last_run = datetime.now(timezone.utc)
        
        # Get all active stakes
        active_stakes = await self.db.staking.find({"status": "active"}).to_list(10000)
        
        roi_count = 0
        total_roi_distributed = 0.0
        users_notified = 0
        completed_stakes = 0
        
        for stake in active_stakes:
            try:
                user_id = stake["user_id"]
                amount = stake["amount"]
                daily_roi = stake.get("daily_roi", 0)
                
                if daily_roi <= 0:
                    continue
                
                # Check if package duration completed
                end_date_str = stake.get("end_date", "")
                if end_date_str:
                    try:
                        if isinstance(end_date_str, str):
                            end_date = datetime.fromisoformat(end_date_str.replace("Z", "+00:00"))
                        else:
                            end_date = end_date_str
                            
                        if datetime.now(timezone.utc) >= end_date:
                            # Mark as completed and return capital
                            if not stake.get("capital_returned", False):
                                await self.db.staking.update_one(
                                    {"staking_entry_id": stake["staking_entry_id"]},
                                    {"$set": {"status": "completed", "capital_returned": True}}
                                )
                                await self.db.users.update_one(
                                    {"user_id": user_id},
                                    {"$inc": {"wallet_balance": amount}}
                                )
                                completed_stakes += 1
                                logger.info(f"Stake completed, capital returned: {stake['staking_entry_id']}")
                            continue
                    except Exception as e:
                        logger.warning(f"Error parsing end date for stake {stake['staking_entry_id']}: {e}")
                
                # Calculate and distribute ROI
                roi_amount = amount * (daily_roi / 100)
                
                # Create ROI transaction
                roi_doc = {
                    "transaction_id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "staking_entry_id": stake["staking_entry_id"],
                    "amount": roi_amount,
                    "roi_percentage": daily_roi,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "auto_distributed": True
                }
                await self.db.roi_transactions.insert_one(roi_doc)
                
                # Update user balances
                await self.db.users.update_one(
                    {"user_id": user_id},
                    {"$inc": {
                        "roi_balance": roi_amount,
                        "wallet_balance": roi_amount
                    },
                    "$set": {
                        "last_roi_date": datetime.now(timezone.utc).isoformat()
                    }}
                )
                
                # Update staking entry
                await self.db.staking.update_one(
                    {"staking_entry_id": stake["staking_entry_id"]},
                    {"$inc": {"total_earned": roi_amount},
                     "$set": {"last_yield_date": datetime.now(timezone.utc).isoformat()}}
                )
                
                roi_count += 1
                total_roi_distributed += roi_amount
                
                # Send email notification
                if self.email_service:
                    user = await self.db.users.find_one({"user_id": user_id}, {"_id": 0})
                    if user:
                        # Get package info
                        package = await self.db.investment_packages.find_one({"package_id": stake.get("package_id")}, {"_id": 0})
                        package_name = package.get("name", "Investment Package") if package else "Investment Package"
                        
                        # Get total ROI
                        updated_user = await self.db.users.find_one({"user_id": user_id}, {"_id": 0})
                        total_roi = updated_user.get("roi_balance", 0) if updated_user else roi_amount
                        
                        try:
                            await self.email_service.send_roi_notification(
                                user["email"],
                                user["full_name"],
                                roi_amount,
                                total_roi,
                                package_name
                            )
                            users_notified += 1
                        except Exception as e:
                            logger.warning(f"Failed to send ROI notification to {user['email']}: {e}")
                
            except Exception as e:
                logger.error(f"Error processing stake {stake.get('staking_entry_id')}: {e}")
                continue
        
        # Log the distribution run
        distribution_log = {
            "log_id": str(uuid.uuid4()),
            "type": "auto_roi_distribution",
            "run_time": datetime.now(timezone.utc).isoformat(),
            "stakes_processed": roi_count,
            "total_roi_distributed": total_roi_distributed,
            "users_notified": users_notified,
            "stakes_completed": completed_stakes,
            "status": "success"
        }
        await self.db.system_logs.insert_one(distribution_log)
        
        # Calculate next run
        self._calculate_next_run()
        
        result = {
            "message": f"Daily ROI distributed successfully",
            "stakes_processed": roi_count,
            "total_roi_distributed": total_roi_distributed,
            "users_notified": users_notified,
            "stakes_completed": completed_stakes,
            "run_time": self.last_run.isoformat(),
            "next_run": self.next_run.isoformat() if self.next_run else None
        }
        
        logger.info(f"ROI Distribution complete: {result}")
        return result
    
    async def _scheduler_loop(self):
        """Background loop that runs ROI distribution at scheduled time"""
        logger.info(f"ROI Scheduler started. Next run: {self.next_run}")
        
        while self.is_running:
            try:
                now = datetime.now(timezone.utc)
                
                if self.next_run and now >= self.next_run:
                    logger.info("Scheduled ROI distribution triggered")
                    await self.distribute_daily_roi()
                
                # Sleep for 1 minute before checking again
                await asyncio.sleep(60)
                
            except Exception as e:
                logger.error(f"Error in ROI scheduler loop: {e}")
                await asyncio.sleep(60)
    
    def start(self):
        """Start the scheduler"""
        if not self.is_running:
            self.is_running = True
            self._calculate_next_run()
            asyncio.create_task(self._scheduler_loop())
            logger.info(f"ROI Scheduler started. Will run daily at {self.run_hour:02d}:{self.run_minute:02d} UTC")
    
    def stop(self):
        """Stop the scheduler"""
        self.is_running = False
        logger.info("ROI Scheduler stopped")
    
    def get_status(self) -> dict:
        """Get scheduler status"""
        return {
            "is_running": self.is_running,
            "last_run": self.last_run.isoformat() if self.last_run else None,
            "next_run": self.next_run.isoformat() if self.next_run else None,
            "schedule": f"{self.run_hour:02d}:{self.run_minute:02d} UTC"
        }


# Global instance
roi_scheduler = ROIScheduler()
