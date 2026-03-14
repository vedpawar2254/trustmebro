"""Email service for sending notifications and verification emails."""
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, List
from dataclasses import dataclass

from src.config import settings
from src.utils.logger import api_logger


@dataclass
class EmailConfig:
    """Email configuration."""
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    username: str = ""
    password: str = ""
    from_email: str = "noreply@trustmebro.com"
    from_name: str = "TrustMeBro"
    use_tls: bool = True

    @classmethod
    def from_settings(cls) -> "EmailConfig":
        """Create EmailConfig from application settings."""
        return cls(
            smtp_host=settings.smtp_host,
            smtp_port=settings.smtp_port,
            username=settings.smtp_username,
            password=settings.smtp_password,
            from_email=settings.email_from,
            from_name=settings.email_from_name,
            use_tls=True,
        )


class EmailService:
    """Service for sending emails via SMTP."""

    def __init__(self, config: Optional[EmailConfig] = None):
        # Load config from settings if not provided
        self.config = config or EmailConfig.from_settings()
        self.dev_mode = not bool(self.config.username and self.config.password)

        if self.dev_mode:
            api_logger.warning("Email service running in DEV MODE - emails will be logged only")
            api_logger.warning("Set SMTP_USERNAME and SMTP_PASSWORD environment variables to enable real emails")
        else:
            api_logger.info(f"Email service configured with SMTP host: {self.config.smtp_host}:{self.config.smtp_port}")

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        Send an email.

        In dev mode, logs the email instead of sending.
        Returns True if successful, False otherwise.
        """
        if self.dev_mode:
            return self._log_email(to_email, subject, html_content)

        return self._send_smtp_email(to_email, subject, html_content, text_content)

    def _log_email(self, to_email: str, subject: str, content: str) -> bool:
        """Log email in dev mode."""
        api_logger.info(f"""
========== DEV EMAIL ==========
To: {to_email}
Subject: {subject}
Content:
{content}
===============================
        """)
        return True

    def _send_smtp_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """Send email via SMTP."""
        try:
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{self.config.from_name} <{self.config.from_email}>"
            message["To"] = to_email

            # Add plain text version
            if text_content:
                part1 = MIMEText(text_content, "plain")
                message.attach(part1)

            # Add HTML version
            part2 = MIMEText(html_content, "html")
            message.attach(part2)

            # Create secure connection and send
            context = ssl.create_default_context()

            with smtplib.SMTP(self.config.smtp_host, self.config.smtp_port) as server:
                if self.config.use_tls:
                    server.starttls(context=context)
                server.login(self.config.username, self.config.password)
                server.sendmail(
                    self.config.from_email,
                    to_email,
                    message.as_string()
                )

            api_logger.info(f"Email sent successfully to {to_email}")
            return True

        except Exception as e:
            api_logger.error(f"Failed to send email to {to_email}: {e}")
            return False

    # ==================== EMAIL TEMPLATES ====================

    def send_verification_email(self, to_email: str, name: str, token: str) -> bool:
        """Send email verification email."""
        verification_url = f"{settings.frontend_url}/verify-email?token={token}"

        subject = "Verify your TrustMeBro account"

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
        .button {{ display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
        .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to TrustMeBro!</h1>
        </div>
        <div class="content">
            <p>Hey {name},</p>
            <p>Thanks for signing up! Please verify your email address to get started.</p>
            <p style="text-align: center;">
                <a href="{verification_url}" class="button">Verify Email</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4F46E5;">{verification_url}</p>
            <p>This link expires in 24 hours.</p>
        </div>
        <div class="footer">
            <p>TrustMeBro - Freelance with confidence</p>
        </div>
    </div>
</body>
</html>
        """

        text_content = f"""
Hey {name},

Thanks for signing up for TrustMeBro!

Please verify your email by clicking this link:
{verification_url}

This link expires in 24 hours.

- The TrustMeBro Team
        """

        return self.send_email(to_email, subject, html_content, text_content)

    def send_bid_notification(
        self,
        to_email: str,
        employer_name: str,
        freelancer_name: str,
        job_title: str,
        job_id: int
    ) -> bool:
        """Notify employer of new bid."""
        job_url = f"{settings.frontend_url}/jobs/{job_id}/bids"

        subject = f"New bid on your job: {job_title}"

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
        .button {{ display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Bid Received!</h1>
        </div>
        <div class="content">
            <p>Hey {employer_name},</p>
            <p><strong>{freelancer_name}</strong> has submitted a bid on your job:</p>
            <p style="font-size: 18px; color: #4F46E5;"><strong>{job_title}</strong></p>
            <p style="text-align: center;">
                <a href="{job_url}" class="button">View Bid</a>
            </p>
        </div>
    </div>
</body>
</html>
        """

        return self.send_email(to_email, subject, html_content)

    def send_assignment_notification(
        self,
        to_email: str,
        freelancer_name: str,
        job_title: str,
        job_id: int,
        employer_name: str
    ) -> bool:
        """Notify freelancer they've been assigned."""
        job_url = f"{settings.frontend_url}/jobs/{job_id}"

        subject = f"You've been assigned: {job_title}"

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
        .button {{ display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Congratulations!</h1>
        </div>
        <div class="content">
            <p>Hey {freelancer_name},</p>
            <p>Great news! <strong>{employer_name}</strong> has accepted your bid.</p>
            <p style="font-size: 18px; color: #4F46E5;"><strong>{job_title}</strong></p>
            <p>Head to the project chat to discuss the details and get started!</p>
            <p style="text-align: center;">
                <a href="{job_url}" class="button">View Project</a>
            </p>
        </div>
    </div>
</body>
</html>
        """

        return self.send_email(to_email, subject, html_content)

    def send_escrow_funded_notification(
        self,
        to_email: str,
        freelancer_name: str,
        job_title: str,
        job_id: int,
        amount: float
    ) -> bool:
        """Notify freelancer that escrow is funded."""
        job_url = f"{settings.frontend_url}/jobs/{job_id}"

        subject = f"Escrow funded - Start working on {job_title}"

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
        .amount {{ font-size: 32px; color: #10B981; text-align: center; margin: 20px 0; }}
        .button {{ display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Escrow Funded!</h1>
        </div>
        <div class="content">
            <p>Hey {freelancer_name},</p>
            <p>The employer has funded the escrow for <strong>{job_title}</strong>.</p>
            <p class="amount">${amount:.2f}</p>
            <p>You can now start working on the first milestone. Submit your work through the platform when ready.</p>
            <p style="text-align: center;">
                <a href="{job_url}" class="button">Start Working</a>
            </p>
        </div>
    </div>
</body>
</html>
        """

        return self.send_email(to_email, subject, html_content)

    def send_submission_notification(
        self,
        to_email: str,
        employer_name: str,
        freelancer_name: str,
        job_title: str,
        job_id: int,
        milestone_name: str
    ) -> bool:
        """Notify employer of new submission."""
        job_url = f"{settings.frontend_url}/jobs/{job_id}/submissions"

        subject = f"New submission for {job_title}"

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
        .button {{ display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Submission!</h1>
        </div>
        <div class="content">
            <p>Hey {employer_name},</p>
            <p><strong>{freelancer_name}</strong> has submitted work for:</p>
            <p style="font-size: 18px; color: #4F46E5;"><strong>{milestone_name}</strong></p>
            <p>Review the submission and trigger verification when ready.</p>
            <p style="text-align: center;">
                <a href="{job_url}" class="button">Review Submission</a>
            </p>
        </div>
    </div>
</body>
</html>
        """

        return self.send_email(to_email, subject, html_content)

    def send_payment_released_notification(
        self,
        to_email: str,
        freelancer_name: str,
        job_title: str,
        milestone_name: str,
        amount: float
    ) -> bool:
        """Notify freelancer of payment release."""
        subject = f"Payment released - ${amount:.2f} for {milestone_name}"

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
        .amount {{ font-size: 48px; color: #10B981; text-align: center; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Payment Released!</h1>
        </div>
        <div class="content">
            <p>Hey {freelancer_name},</p>
            <p>Your work on <strong>{milestone_name}</strong> has been verified!</p>
            <p class="amount">${amount:.2f}</p>
            <p>The payment has been released to your account.</p>
            <p>Keep up the great work!</p>
        </div>
    </div>
</body>
</html>
        """

        return self.send_email(to_email, subject, html_content)

    def send_job_completed_notification(
        self,
        to_email: str,
        name: str,
        job_title: str,
        total_amount: float,
        is_employer: bool
    ) -> bool:
        """Notify user that job is completed."""
        subject = f"Project completed: {job_title}"

        if is_employer:
            message = f"All milestones have been verified and ${total_amount:.2f} has been released to the freelancer."
        else:
            message = f"All milestones verified! You've earned ${total_amount:.2f} on this project."

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
        .celebration {{ font-size: 48px; text-align: center; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Project Complete!</h1>
        </div>
        <div class="content">
            <p class="celebration">🎉</p>
            <p>Hey {name},</p>
            <p>Congratulations! <strong>{job_title}</strong> has been completed.</p>
            <p>{message}</p>
            <p>Thanks for using TrustMeBro!</p>
        </div>
    </div>
</body>
</html>
        """

        return self.send_email(to_email, subject, html_content)


    def send_deadline_reminder(
        self,
        to_email: str,
        name: str,
        job_title: str,
        job_id: int,
        days_remaining: int
    ) -> bool:
        """Send deadline reminder email."""
        job_url = f"{settings.frontend_url}/projects/{job_id}"

        urgency_color = "#EF4444" if days_remaining <= 1 else "#F59E0B" if days_remaining <= 3 else "#3B82F6"

        subject = f"Deadline in {days_remaining} day{'s' if days_remaining != 1 else ''}: {job_title}"

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: {urgency_color}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
        .countdown {{ font-size: 48px; text-align: center; color: {urgency_color}; margin: 20px 0; }}
        .button {{ display: inline-block; background: {urgency_color}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Deadline Reminder</h1>
        </div>
        <div class="content">
            <p>Hey {name},</p>
            <p class="countdown">{days_remaining} day{'s' if days_remaining != 1 else ''} left</p>
            <p>Your deadline for <strong>{job_title}</strong> is approaching.</p>
            <p>Make sure to submit your work before the deadline to avoid any issues.</p>
            <p style="text-align: center;">
                <a href="{job_url}" class="button">View Project</a>
            </p>
        </div>
    </div>
</body>
</html>
        """

        return self.send_email(to_email, subject, html_content)

    def send_ghost_warning(
        self,
        to_email: str,
        name: str,
        job_title: str,
        job_id: int,
        hours_inactive: int,
        warning_level: str  # 'warning', 'escalation', 'final'
    ) -> bool:
        """Send ghost protocol warning email."""
        job_url = f"{settings.frontend_url}/projects/{job_id}"

        if warning_level == 'final':
            header_color = "#EF4444"
            header_text = "Final Warning - Action Required"
            message = "You have been inactive for an extended period. If we don't hear from you soon, the project may be reassigned or disputed."
        elif warning_level == 'escalation':
            header_color = "#F59E0B"
            header_text = "Inactivity Warning"
            message = f"You've been inactive for {hours_inactive} hours. Please check in on the project to avoid any issues."
        else:
            header_color = "#3B82F6"
            header_text = "Check-in Reminder"
            message = "We noticed you haven't been active on this project recently. Drop a message to let everyone know you're still around!"

        subject = f"[{warning_level.upper()}] Activity check: {job_title}"

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: {header_color}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
        .button {{ display: inline-block; background: {header_color}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{header_text}</h1>
        </div>
        <div class="content">
            <p>Hey {name},</p>
            <p>{message}</p>
            <p>Project: <strong>{job_title}</strong></p>
            <p style="text-align: center;">
                <a href="{job_url}" class="button">Check In Now</a>
            </p>
        </div>
    </div>
</body>
</html>
        """

        return self.send_email(to_email, subject, html_content)

    def send_dispute_notification(
        self,
        to_email: str,
        name: str,
        job_title: str,
        job_id: int,
        dispute_reason: str,
        initiated_by: str
    ) -> bool:
        """Send dispute notification email."""
        job_url = f"{settings.frontend_url}/projects/{job_id}/dispute"

        subject = f"Dispute filed: {job_title}"

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #EF4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
        .reason {{ background: #FEF2F2; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0; }}
        .button {{ display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Dispute Filed</h1>
        </div>
        <div class="content">
            <p>Hey {name},</p>
            <p>A dispute has been filed on <strong>{job_title}</strong> by {initiated_by}.</p>
            <div class="reason">
                <strong>Reason:</strong><br/>
                {dispute_reason}
            </div>
            <p>The escrow funds are now on hold pending resolution. You can submit evidence and respond to the dispute through the platform.</p>
            <p style="text-align: center;">
                <a href="{job_url}" class="button">View Dispute</a>
            </p>
        </div>
    </div>
</body>
</html>
        """

        return self.send_email(to_email, subject, html_content)

    def send_change_request_notification(
        self,
        to_email: str,
        name: str,
        job_title: str,
        job_id: int,
        change_type: str,
        description: str,
        requested_by: str
    ) -> bool:
        """Send change request notification email."""
        job_url = f"{settings.frontend_url}/projects/{job_id}/changes"

        subject = f"Change request: {job_title}"

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #F59E0B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
        .change-box {{ background: #FFFBEB; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }}
        .button {{ display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Change Request</h1>
        </div>
        <div class="content">
            <p>Hey {name},</p>
            <p>{requested_by} has requested a change to <strong>{job_title}</strong>.</p>
            <div class="change-box">
                <strong>Type:</strong> {change_type}<br/><br/>
                <strong>Description:</strong><br/>
                {description}
            </div>
            <p>Please review and approve or reject this change request.</p>
            <p style="text-align: center;">
                <a href="{job_url}" class="button">Review Change</a>
            </p>
        </div>
    </div>
</body>
</html>
        """

        return self.send_email(to_email, subject, html_content)

    def send_verification_result(
        self,
        to_email: str,
        name: str,
        job_title: str,
        job_id: int,
        milestone_name: str,
        score: int,
        result: str,  # 'pass', 'hold', 'fail'
        feedback: Optional[str] = None
    ) -> bool:
        """Send verification result notification."""
        job_url = f"{settings.frontend_url}/projects/{job_id}/verification"

        if result == 'pass':
            header_color = "#10B981"
            header_text = "Submission Approved!"
            emoji = "✅"
            message = "Your submission has passed verification and the payment has been released."
        elif result == 'hold':
            header_color = "#F59E0B"
            header_text = "Submission Needs Review"
            emoji = "⚠️"
            message = "Your submission requires employer review before proceeding."
        else:
            header_color = "#EF4444"
            header_text = "Submission Rejected"
            emoji = "❌"
            message = "Your submission did not pass verification. Please review the feedback and resubmit."

        subject = f"{emoji} Verification result for {milestone_name}"

        feedback_section = f"""
            <div style="background: #f3f4f6; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <strong>Feedback:</strong><br/>
                {feedback}
            </div>
        """ if feedback else ""

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: {header_color}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
        .score {{ font-size: 64px; text-align: center; color: {header_color}; margin: 20px 0; }}
        .button {{ display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{header_text}</h1>
        </div>
        <div class="content">
            <p>Hey {name},</p>
            <p class="score">{score}/100</p>
            <p>{message}</p>
            <p>Milestone: <strong>{milestone_name}</strong><br/>
            Project: <strong>{job_title}</strong></p>
            {feedback_section}
            <p style="text-align: center;">
                <a href="{job_url}" class="button">View Details</a>
            </p>
        </div>
    </div>
</body>
</html>
        """

        return self.send_email(to_email, subject, html_content)


# Singleton instance - loads config from settings
email_service = EmailService()
