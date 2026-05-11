"""SQLAlchemy models for the crypto parser bot.

Simplified models: just ParseLog for tracking parse jobs.
Messages are stored in JSON files, not in DB.
"""

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, Float, func
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


class ForecastTracking(Base):
    """Tracks AI hourly forecasts vs real CoinMarketCap prices."""

    __tablename__ = "forecast_trackings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    analysis_id: Mapped[int] = mapped_column(Integer, nullable=False)  # FK to AnalysisLog.id
    symbol: Mapped[str] = mapped_column(String(20), nullable=False)  # BTC, ETH, SOL, XRP
    prediction: Mapped[str] = mapped_column(String(20), nullable=False)  # Bullish, Bearish, Neutral
    confidence: Mapped[int] = mapped_column(Integer, default=0)

    # Snapshot at creation time
    start_price: Mapped[float] = mapped_column(Float, nullable=False)
    target_price_24h: Mapped[float | None] = mapped_column(Float, nullable=True)
    target_change_24h: Mapped[float | None] = mapped_column(Float, nullable=True)

    # AI hourly forecast (JSON: [{hourOffset, price, change, confidence}])
    hourly_forecast_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Actual hourly prices from CMC (JSON: [{timestamp, price, predicted_price, matched}])
    actual_prices_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Actual hourly prices from Binance (JSON: [{timestamp, hour, close_price, predicted_price, matched}])
    binance_prices_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Polymarket-style: 1h candle open/close (JSON: [{timestamp, hour, open, close, direction, predicted_direction, matched}])
    polymarket_prices_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Status
    status: Mapped[str] = mapped_column(String(20), default="active")  # active, completed, expired
    hours_tracked: Mapped[int] = mapped_column(Integer, default=0)
    hits: Mapped[int] = mapped_column(Integer, default=0)  # hours where direction matched
    misses: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    def __repr__(self) -> str:
        return f"<ForecastTracking({self.symbol}, {self.prediction}, {self.hits}/{self.hours_tracked})>"



class AltcoinTracking(Base):
    """Tracks weekly altcoin picks vs actual performance."""

    __tablename__ = "altcoin_trackings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    analysis_id: Mapped[int] = mapped_column(Integer, nullable=False)  # FK to AnalysisLog.id
    symbol: Mapped[str] = mapped_column(String(20), nullable=False)  # PEPE, WIF, etc.
    name: Mapped[str] = mapped_column(String(100), nullable=True)

    # AI prediction
    confidence: Mapped[int] = mapped_column(Integer, default=0)
    risk: Mapped[str] = mapped_column(String(20), nullable=True)  # Medium, High, Degen
    target_change_7d: Mapped[float] = mapped_column(Float, default=0)  # AI predicted % change
    catalyst: Mapped[str | None] = mapped_column(Text, nullable=True)
    reasoning: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Prices at analysis time
    start_price: Mapped[float] = mapped_column(Float, nullable=False)
    target_price_7d: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Actual result (filled after 7 days)
    end_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    actual_change_7d: Mapped[float | None] = mapped_column(Float, nullable=True)
    hit_target: Mapped[bool | None] = mapped_column(Integer, nullable=True)  # 1 = hit 10%+, 0 = miss

    # Status
    status: Mapped[str] = mapped_column(String(20), default="active")  # active, completed
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    def __repr__(self) -> str:
        return f"<AltcoinTracking({self.symbol}, target={self.target_change_7d}%, actual={self.actual_change_7d}%)>"
