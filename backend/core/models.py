"""SQLAlchemy models for the crypto parser bot.

Simplified models: just ParseLog for tracking parse jobs.
Messages are stored in JSON files, not in DB.
"""

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


class ParseLog(Base):
    """Model for storing parsing job logs."""

    __tablename__ = "parse_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
    finished_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="running")
    chats_parsed: Mapped[int] = mapped_column(Integer, default=0)
    messages_found: Mapped[int] = mapped_column(Integer, default=0)
    json_data: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON stored in DB
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    def __repr__(self) -> str:
        return f"<ParseLog(id={self.id}, status='{self.status}')>"


class AnalysisLog(Base):
    """Model for storing scheduled/manual AI analysis results."""

    __tablename__ = "analysis_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
    finished_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    mode: Mapped[str] = mapped_column(String(50), default="simple")
    status: Mapped[str] = mapped_column(String(20), default="running")
    result_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    reddit_posts_count: Mapped[int] = mapped_column(Integer, default=0)
    twitter_tweets_count: Mapped[int] = mapped_column(Integer, default=0)
    telegram_msgs_count: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    trigger: Mapped[str] = mapped_column(String(20), default="scheduled")  # scheduled / manual

    def __repr__(self) -> str:
        return f"<AnalysisLog(id={self.id}, mode='{self.mode}', status='{self.status}')>"
