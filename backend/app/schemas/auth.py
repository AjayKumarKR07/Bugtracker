"""
Pydantic schemas for authentication endpoints.

All response models deliberately exclude password_hash, otp, and otp_hash.
"""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.user import UserRole


# --------------------------------------------------------------------------- #
# Request schemas                                                              #
# --------------------------------------------------------------------------- #

class RegisterRequest(BaseModel):
    """Body for POST /auth/register."""

    full_name: str = Field(
        ..., min_length=1, max_length=200, examples=["Jane Developer"]
    )
    email: EmailStr = Field(..., examples=["jane@example.com"])
    password: str = Field(..., min_length=8, examples=["StrongPass123"])
    role: UserRole = Field(..., examples=["DEVELOPER"])

    @field_validator("role")
    @classmethod
    def role_must_not_be_admin(cls, v: UserRole) -> UserRole:
        """ADMIN accounts cannot be self-registered through the public API."""
        if v == UserRole.ADMIN:
            raise ValueError(
                "ADMIN role cannot be assigned via public registration."
            )
        return v


class VerifyOTPRequest(BaseModel):
    """Body for POST /auth/verify-otp."""

    email: EmailStr = Field(..., examples=["jane@example.com"])
    otp: str = Field(
        ...,
        min_length=6,
        max_length=6,
        pattern=r"^\d{6}$",
        examples=["483921"],
    )


class ResendOTPRequest(BaseModel):
    """Body for POST /auth/resend-otp."""

    email: EmailStr = Field(..., examples=["jane@example.com"])


class LoginRequest(BaseModel):
    """Body for POST /auth/login."""

    email: EmailStr = Field(..., examples=["jane@example.com"])
    password: str = Field(..., min_length=1, examples=["StrongPass123"])


# --------------------------------------------------------------------------- #
# Response schemas                                                             #
# --------------------------------------------------------------------------- #

class UserResponse(BaseModel):
    """Safe public user representation — never includes password or OTP fields."""

    id: int
    full_name: str
    email: str
    role: UserRole
    is_active: bool
    is_email_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """Response for POST /auth/login."""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class MessageResponse(BaseModel):
    """Generic success message response."""

    message: str


class LogoutResponse(BaseModel):
    """Response for POST /auth/logout."""

    message: str = "Logged out successfully."
