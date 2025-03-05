"""
Analytics models for reporting and dashboard functionality.
"""
from datetime import datetime, date
from enum import Enum
from typing import Dict, List, Optional, Any, Union, Literal

from pydantic import BaseModel, Field


class TimeRange(str, Enum):
    """Time range options for analytics"""
    TODAY = "today"
    YESTERDAY = "yesterday"
    THIS_WEEK = "this_week"
    LAST_WEEK = "last_week"
    THIS_MONTH = "this_month"
    LAST_MONTH = "last_month"
    THIS_QUARTER = "this_quarter"
    LAST_QUARTER = "last_quarter"
    THIS_YEAR = "this_year"
    LAST_YEAR = "last_year"
    CUSTOM = "custom"


class DateRange(BaseModel):
    """Date range for analytics queries"""
    start_date: datetime
    end_date: datetime


class MetricType(str, Enum):
    """Types of metrics for analytics"""
    COUNT = "count"
    SUM = "sum"
    AVERAGE = "average"
    RATIO = "ratio"
    PERCENTAGE = "percentage"


class Dimension(str, Enum):
    """Dimensions for analytics"""
    DATE = "date"
    WEEK = "week"
    MONTH = "month"
    QUARTER = "quarter"
    YEAR = "year"
    USER = "user"
    TEAM = "team"
    LEAD_SOURCE = "lead_source"
    LEAD_STATUS = "lead_status"
    CAMPAIGN = "campaign"


class Metric(BaseModel):
    """Metric for analytics"""
    name: str
    value: float
    type: MetricType
    comparison_value: Optional[float] = None
    comparison_label: Optional[str] = None
    change_percentage: Optional[float] = None
    is_positive_change: Optional[bool] = None
    dimension: Optional[Dimension] = None
    formatter: Optional[str] = None  # E.g., "currency", "percentage", "number"


class ChartType(str, Enum):
    """Types of charts for analytics"""
    LINE = "line"
    BAR = "bar"
    AREA = "area"
    PIE = "pie"
    DONUT = "donut"
    TABLE = "table"
    NUMBER = "number"


class DataPoint(BaseModel):
    """Data point for charts"""
    x: Any  # X-axis value (often a date or category)
    y: float  # Y-axis value
    label: Optional[str] = None  # Optional label
    color: Optional[str] = None  # Optional color


class ChartSeries(BaseModel):
    """Series of data for charts"""
    name: str
    data: List[DataPoint]
    color: Optional[str] = None


class Chart(BaseModel):
    """Chart model for analytics"""
    id: Optional[str] = None
    title: str
    type: ChartType
    description: Optional[str] = None
    series: List[ChartSeries]
    x_axis_label: Optional[str] = None
    y_axis_label: Optional[str] = None
    is_stacked: bool = False
    colors: Optional[List[str]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class Dashboard(BaseModel):
    """Dashboard model for analytics"""
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    user_id: str
    is_default: bool = False
    layout: Optional[Dict[str, Any]] = None  # For storing grid layout
    charts: List[Chart] = Field(default_factory=list)
    metrics: List[Metric] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class DashboardCreate(BaseModel):
    """Dashboard creation model"""
    name: str
    description: Optional[str] = None
    is_default: bool = False
    layout: Optional[Dict[str, Any]] = None


class DashboardUpdate(BaseModel):
    """Dashboard update model"""
    name: Optional[str] = None
    description: Optional[str] = None
    is_default: Optional[bool] = None
    layout: Optional[Dict[str, Any]] = None


class ReportType(str, Enum):
    """Types of reports"""
    LEAD_PERFORMANCE = "lead_performance"
    SALES_PIPELINE = "sales_pipeline"
    TEAM_PERFORMANCE = "team_performance"
    CAMPAIGN_PERFORMANCE = "campaign_performance"
    CONVERSION_RATES = "conversion_rates"
    ACTIVITY_SUMMARY = "activity_summary"
    CUSTOM = "custom"


class ReportFormat(str, Enum):
    """Report export formats"""
    PDF = "pdf"
    CSV = "csv"
    EXCEL = "excel"
    JSON = "json"


class ReportScheduleFrequency(str, Enum):
    """Frequency options for scheduled reports"""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"


class ReportFilter(BaseModel):
    """Filter for reports"""
    field: str
    operator: str  # "eq", "gt", "lt", "contains", etc.
    value: Any


class ReportColumn(BaseModel):
    """Column for reports"""
    field: str
    title: str
    visible: bool = True
    sortable: bool = True
    formatter: Optional[str] = None


class Report(BaseModel):
    """Report model for analytics"""
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    type: ReportType
    user_id: str
    team_id: Optional[str] = None
    is_favorite: bool = False
    filters: List[ReportFilter] = Field(default_factory=list)
    columns: List[ReportColumn] = Field(default_factory=list)
    sort_by: Optional[str] = None
    sort_direction: Optional[str] = None
    chart: Optional[Chart] = None
    date_range: Optional[DateRange] = None
    time_range: TimeRange = TimeRange.THIS_MONTH
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ReportCreate(BaseModel):
    """Report creation model"""
    name: str
    description: Optional[str] = None
    type: ReportType
    team_id: Optional[str] = None
    filters: List[ReportFilter] = Field(default_factory=list)
    columns: List[ReportColumn] = Field(default_factory=list)
    sort_by: Optional[str] = None
    sort_direction: Optional[str] = None
    chart: Optional[Chart] = None
    time_range: TimeRange = TimeRange.THIS_MONTH
    date_range: Optional[DateRange] = None


class ReportUpdate(BaseModel):
    """Report update model"""
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[ReportType] = None
    team_id: Optional[str] = None
    is_favorite: Optional[bool] = None
    filters: Optional[List[ReportFilter]] = None
    columns: Optional[List[ReportColumn]] = None
    sort_by: Optional[str] = None
    sort_direction: Optional[str] = None
    chart: Optional[Chart] = None
    time_range: Optional[TimeRange] = None
    date_range: Optional[DateRange] = None


class ReportSchedule(BaseModel):
    """Schedule for automated report delivery"""
    id: Optional[str] = None
    report_id: str
    name: str
    frequency: ReportScheduleFrequency
    day_of_week: Optional[int] = None  # 0-6 for Sunday-Saturday (for weekly)
    day_of_month: Optional[int] = None  # 1-31 (for monthly)
    time: str  # HH:MM format
    recipients: List[str]  # List of email addresses
    format: ReportFormat
    is_active: bool = True
    last_sent: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ReportExportRequest(BaseModel):
    """Request for exporting a report"""
    report_id: str
    format: ReportFormat
    filters: Optional[List[ReportFilter]] = None
    time_range: Optional[TimeRange] = None
    date_range: Optional[DateRange] = None


class AnalyticsRequest(BaseModel):
    """Request for analytics data"""
    metrics: List[str]
    dimensions: Optional[List[Dimension]] = None
    filters: Optional[List[ReportFilter]] = None
    time_range: TimeRange = TimeRange.THIS_MONTH
    date_range: Optional[DateRange] = None
    sort_by: Optional[str] = None
    sort_direction: Optional[str] = None
    limit: Optional[int] = None


class AnalyticsResponse(BaseModel):
    """Response with analytics data"""
    metrics: List[Metric]
    chart_data: Optional[Chart] = None
    time_range: TimeRange
    date_range: Optional[DateRange] = None


class TimeSeriesMetric(BaseModel):
    """Time series data point"""
    date: datetime
    value: float


class LeadAnalytics(BaseModel):
    """Analytics for leads"""
    total_leads: Optional[int] = 0
    new_leads: Optional[int] = 0
    qualified_leads: Optional[int] = 0
    converted_leads: Optional[int] = 0
    conversion_rate: Optional[float] = 0
    avg_time_to_conversion: Optional[float] = 0  # in seconds
    leads_over_time: Optional[List[TimeSeriesMetric]] = Field(default_factory=list)
    grouped_metrics: Optional[Dict[str, Dict[str, Any]]] = Field(default_factory=dict)
    date_range: DateRange


class CampaignAnalytics(BaseModel):
    """Analytics for marketing campaigns"""
    campaigns: List[Dict[str, Any]] = Field(default_factory=list)
    total_campaigns: int = 0
    total_leads_generated: int = 0
    avg_conversion_rate: float = 0
    date_range: DateRange


class UserPerformance(BaseModel):
    """Performance metrics for a user/sales rep"""
    user_id: int
    user_name: str
    leads_assigned: int = 0
    leads_converted: int = 0
    conversion_rate: float = 0
    avg_response_time: Optional[float] = None  # in seconds
    avg_time_to_conversion: Optional[float] = None  # in seconds
    meetings_scheduled: int = 0
    emails_sent: int = 0
    tasks_completed: int = 0
    tasks_overdue: int = 0
    performance_trend: Optional[List[TimeSeriesMetric]] = None
    date_range: DateRange


class ConversionFunnel(BaseModel):
    """Conversion funnel analytics"""
    stages: List[Dict[str, Any]] = Field(default_factory=list)
    overall_conversion_rate: float = 0
    date_range: DateRange 