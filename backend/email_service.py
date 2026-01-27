"""
Email Service for MINEX GLOBAL Platform
Using SendGrid for transactional emails
"""
import os
import logging
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Attachment, FileContent, FileName, FileType, Disposition
import base64

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.api_key = os.environ.get('SENDGRID_API_KEY')
        self.sender_email = os.environ.get('SENDER_EMAIL', 'admin@minexglobal.online')
        self.is_configured = bool(self.api_key)
        
    def _get_client(self):
        if not self.is_configured:
            logger.warning("SendGrid API key not configured")
            return None
        return SendGridAPIClient(self.api_key)
    
    def _get_email_template(self, title: str, content: str) -> str:
        """Generate professional HTML email template"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #0a0a0f; }}
                .container {{ max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; }}
                .header {{ background: linear-gradient(90deg, #3b82f6, #8b5cf6); padding: 30px; text-align: center; }}
                .logo {{ font-size: 28px; font-weight: bold; color: white; letter-spacing: 2px; }}
                .content {{ padding: 40px 30px; color: #e5e7eb; }}
                .title {{ font-size: 24px; font-weight: bold; color: white; margin-bottom: 20px; }}
                .message {{ font-size: 16px; line-height: 1.6; color: #9ca3af; }}
                .highlight {{ background: linear-gradient(90deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: bold; }}
                .code-box {{ background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0; }}
                .code {{ font-size: 36px; font-weight: bold; color: #3b82f6; letter-spacing: 8px; font-family: monospace; }}
                .button {{ display: inline-block; background: linear-gradient(90deg, #3b82f6, #8b5cf6); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }}
                .footer {{ background: #0f0f1a; padding: 30px; text-align: center; color: #6b7280; font-size: 12px; }}
                .divider {{ height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">MINEX GLOBAL</div>
                </div>
                <div class="content">
                    <div class="title">{title}</div>
                    {content}
                </div>
                <div class="footer">
                    <p>© 2025 MINEX GLOBAL. All rights reserved.</p>
                    <p>This is an automated message. Please do not reply directly to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    async def send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        """Send an email via SendGrid"""
        try:
            client = self._get_client()
            if not client:
                logger.warning(f"Email not sent (not configured): {subject} to {to_email}")
                return False
            
            message = Mail(
                from_email=self.sender_email,
                to_emails=to_email,
                subject=subject,
                html_content=html_content
            )
            
            response = client.send(message)
            logger.info(f"Email sent successfully: {subject} to {to_email}, status: {response.status_code}")
            return response.status_code == 202
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return False
    
    async def send_verification_code(self, to_email: str, code: str, user_name: str = "User") -> bool:
        """Send email verification code"""
        content = f"""
        <p class="message">Hello {user_name},</p>
        <p class="message">Welcome to <span class="highlight">MINEX GLOBAL</span>! To complete your registration, please use the verification code below:</p>
        <div class="code-box">
            <div class="code">{code}</div>
        </div>
        <p class="message">This code will expire in 10 minutes.</p>
        <div class="divider"></div>
        <p class="message" style="font-size: 14px;">If you didn't request this verification, please ignore this email.</p>
        """
        
        html_content = self._get_email_template("Email Verification", content)
        return await self.send_email(to_email, "MINEX GLOBAL - Email Verification Code", html_content)
    
    async def send_deposit_approved(self, to_email: str, user_name: str, amount: float) -> bool:
        """Send deposit approval notification"""
        content = f"""
        <p class="message">Hello {user_name},</p>
        <p class="message">Great news! Your deposit has been <span class="highlight">approved</span>.</p>
        <div class="code-box">
            <div style="font-size: 14px; color: #9ca3af; margin-bottom: 10px;">Deposit Amount</div>
            <div class="code" style="font-size: 28px; letter-spacing: 2px;">${amount:,.2f}</div>
        </div>
        <p class="message">The funds have been credited to your account balance and are now available for investment.</p>
        <div class="divider"></div>
        <p class="message">Start investing now to maximize your returns!</p>
        """
        
        html_content = self._get_email_template("Deposit Approved", content)
        return await self.send_email(to_email, "MINEX GLOBAL - Deposit Approved", html_content)
    
    async def send_deposit_rejected(self, to_email: str, user_name: str, amount: float, reason: str) -> bool:
        """Send deposit rejection notification"""
        content = f"""
        <p class="message">Hello {user_name},</p>
        <p class="message">We regret to inform you that your deposit request has been <span style="color: #ef4444; font-weight: bold;">rejected</span>.</p>
        <div class="code-box" style="border-color: rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.1);">
            <div style="font-size: 14px; color: #9ca3af; margin-bottom: 10px;">Requested Amount</div>
            <div style="font-size: 24px; color: #ef4444; font-weight: bold;">${amount:,.2f}</div>
        </div>
        <p class="message"><strong>Reason:</strong> {reason}</p>
        <div class="divider"></div>
        <p class="message">If you believe this is an error, please contact our support team.</p>
        """
        
        html_content = self._get_email_template("Deposit Rejected", content)
        return await self.send_email(to_email, "MINEX GLOBAL - Deposit Status Update", html_content)
    
    async def send_withdrawal_approved(self, to_email: str, user_name: str, amount: float, tx_hash: str) -> bool:
        """Send withdrawal approval notification"""
        content = f"""
        <p class="message">Hello {user_name},</p>
        <p class="message">Your withdrawal request has been <span class="highlight">processed successfully</span>.</p>
        <div class="code-box">
            <div style="font-size: 14px; color: #9ca3af; margin-bottom: 10px;">Withdrawal Amount</div>
            <div class="code" style="font-size: 28px; letter-spacing: 2px;">${amount:,.2f}</div>
        </div>
        <p class="message"><strong>Transaction Hash:</strong></p>
        <p class="message" style="word-break: break-all; font-family: monospace; font-size: 12px; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px;">{tx_hash}</p>
        <div class="divider"></div>
        <p class="message">The funds should arrive in your wallet shortly.</p>
        """
        
        html_content = self._get_email_template("Withdrawal Processed", content)
        return await self.send_email(to_email, "MINEX GLOBAL - Withdrawal Processed", html_content)
    
    async def send_withdrawal_rejected(self, to_email: str, user_name: str, amount: float, reason: str) -> bool:
        """Send withdrawal rejection notification"""
        content = f"""
        <p class="message">Hello {user_name},</p>
        <p class="message">We regret to inform you that your withdrawal request has been <span style="color: #ef4444; font-weight: bold;">rejected</span>.</p>
        <div class="code-box" style="border-color: rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.1);">
            <div style="font-size: 14px; color: #9ca3af; margin-bottom: 10px;">Requested Amount</div>
            <div style="font-size: 24px; color: #ef4444; font-weight: bold;">${amount:,.2f}</div>
        </div>
        <p class="message"><strong>Reason:</strong> {reason}</p>
        <p class="message">The amount has been restored to your account balance.</p>
        <div class="divider"></div>
        <p class="message">If you believe this is an error, please contact our support team.</p>
        """
        
        html_content = self._get_email_template("Withdrawal Rejected", content)
        return await self.send_email(to_email, "MINEX GLOBAL - Withdrawal Status Update", html_content)
    
    async def send_level_promotion(self, to_email: str, user_name: str, old_level: int, new_level: int) -> bool:
        """Send level promotion notification"""
        content = f"""
        <p class="message">Hello {user_name},</p>
        <p class="message">Congratulations! You've been <span class="highlight">promoted</span> to a higher level!</p>
        <div class="code-box">
            <div style="font-size: 14px; color: #9ca3af; margin-bottom: 10px;">Your New Level</div>
            <div class="code" style="font-size: 48px; letter-spacing: 4px;">LEVEL {new_level}</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 10px;">Previously Level {old_level}</div>
        </div>
        <p class="message">With this promotion, you now enjoy:</p>
        <ul class="message" style="list-style: none; padding: 0;">
            <li style="padding: 8px 0;">✓ Higher daily ROI percentage</li>
            <li style="padding: 8px 0;">✓ Better commission rates</li>
            <li style="padding: 8px 0;">✓ Increased investment limits</li>
        </ul>
        <div class="divider"></div>
        <p class="message">Keep growing your team to unlock even more rewards!</p>
        """
        
        html_content = self._get_email_template("Level Promotion", content)
        return await self.send_email(to_email, "MINEX GLOBAL - Level Promotion!", html_content)
    
    async def send_password_change_confirmation(self, to_email: str, user_name: str) -> bool:
        """Send password change confirmation"""
        content = f"""
        <p class="message">Hello {user_name},</p>
        <p class="message">Your password has been <span class="highlight">successfully changed</span>.</p>
        <div class="code-box">
            <div style="font-size: 48px;">🔐</div>
            <div style="font-size: 14px; color: #9ca3af; margin-top: 10px;">Password Updated</div>
        </div>
        <p class="message">If you did not make this change, please contact our support team immediately.</p>
        <div class="divider"></div>
        <p class="message" style="font-size: 14px;">For security, we recommend using a unique password for each account.</p>
        """
        
        html_content = self._get_email_template("Password Changed", content)
        return await self.send_email(to_email, "MINEX GLOBAL - Password Changed", html_content)


# Global instance
email_service = EmailService()
