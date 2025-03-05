"""
Analytics service for generating reports, dashboards, and metrics.
This service provides functionality for creating and managing analytics 
dashboards, reports, and generating metrics from CRM data.
"""
import logging
from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Any, Union, Tuple
from uuid import uuid4

from sqlalchemy import text, func, desc, asc
from sqlalchemy.orm import Session

from ..models.analytics import (
    Dashboard, DashboardCreate, DashboardUpdate,
    Report, ReportCreate, ReportUpdate, ReportType,
    ReportSchedule, ReportExportRequest, ReportFormat,
    Chart, ChartType, ChartSeries, DataPoint,
    Metric, MetricType, TimeRange, DateRange,
    Dimension, ReportFilter, AnalyticsRequest, AnalyticsResponse
)
from ..core.database import get_db
from ..core.exceptions import NotFoundException, BadRequestException

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Service for generating and managing analytics."""

    @staticmethod
    def _get_date_range_from_time_range(time_range: TimeRange) -> DateRange:
        """Convert a TimeRange enum to a DateRange with concrete dates."""
        today = date.today()
        
        if time_range == TimeRange.TODAY:
            return DateRange(start_date=today, end_date=today)
        
        elif time_range == TimeRange.YESTERDAY:
            yesterday = today - timedelta(days=1)
            return DateRange(start_date=yesterday, end_date=yesterday)
        
        elif time_range == TimeRange.THIS_WEEK:
            start_of_week = today - timedelta(days=today.weekday())
            return DateRange(start_date=start_of_week, end_date=today)
        
        elif time_range == TimeRange.LAST_WEEK:
            end_of_last_week = today - timedelta(days=today.weekday() + 1)
            start_of_last_week = end_of_last_week - timedelta(days=6)
            return DateRange(start_date=start_of_last_week, end_date=end_of_last_week)
        
        elif time_range == TimeRange.THIS_MONTH:
            start_of_month = date(today.year, today.month, 1)
            return DateRange(start_date=start_of_month, end_date=today)
        
        elif time_range == TimeRange.LAST_MONTH:
            if today.month == 1:
                # Last month was December of the previous year
                start_of_last_month = date(today.year - 1, 12, 1)
                end_of_last_month = date(today.year, 1, 1) - timedelta(days=1)
            else:
                # Last month was in the same year
                start_of_last_month = date(today.year, today.month - 1, 1)
                end_of_last_month = date(today.year, today.month, 1) - timedelta(days=1)
            return DateRange(start_date=start_of_last_month, end_date=end_of_last_month)
        
        elif time_range == TimeRange.THIS_QUARTER:
            quarter = (today.month - 1) // 3 + 1
            start_of_quarter = date(today.year, (quarter - 1) * 3 + 1, 1)
            return DateRange(start_date=start_of_quarter, end_date=today)
        
        elif time_range == TimeRange.LAST_QUARTER:
            current_quarter = (today.month - 1) // 3 + 1
            last_quarter = current_quarter - 1 if current_quarter > 1 else 4
            last_quarter_year = today.year if current_quarter > 1 else today.year - 1
            
            start_of_last_quarter = date(last_quarter_year, (last_quarter - 1) * 3 + 1, 1)
            if last_quarter == 4:
                end_of_last_quarter = date(last_quarter_year + 1, 1, 1) - timedelta(days=1)
            else:
                end_of_last_quarter = date(last_quarter_year, last_quarter * 3 + 1, 1) - timedelta(days=1)
                
            return DateRange(start_date=start_of_last_quarter, end_date=end_of_last_quarter)
        
        elif time_range == TimeRange.THIS_YEAR:
            start_of_year = date(today.year, 1, 1)
            return DateRange(start_date=start_of_year, end_date=today)
        
        elif time_range == TimeRange.LAST_YEAR:
            start_of_last_year = date(today.year - 1, 1, 1)
            end_of_last_year = date(today.year, 1, 1) - timedelta(days=1)
            return DateRange(start_date=start_of_last_year, end_date=end_of_last_year)
        
        # For custom time ranges, we would expect the date_range to be provided
        raise BadRequestException("Custom time range requires explicit date_range parameter")

    @staticmethod
    def _apply_filters_to_query(query, table, filters: List[ReportFilter]):
        """Apply a list of filters to an SQL query."""
        if not filters:
            return query
            
        for filter_item in filters:
            column = getattr(table, filter_item.field, None)
            if column is None:
                continue
                
            if filter_item.operator == "eq":
                query = query.filter(column == filter_item.value)
            elif filter_item.operator == "neq":
                query = query.filter(column != filter_item.value)
            elif filter_item.operator == "gt":
                query = query.filter(column > filter_item.value)
            elif filter_item.operator == "gte":
                query = query.filter(column >= filter_item.value)
            elif filter_item.operator == "lt":
                query = query.filter(column < filter_item.value)
            elif filter_item.operator == "lte":
                query = query.filter(column <= filter_item.value)
            elif filter_item.operator == "contains":
                query = query.filter(column.contains(filter_item.value))
            elif filter_item.operator == "in":
                query = query.filter(column.in_(filter_item.value))
                
        return query

    # Dashboard methods
    async def create_dashboard(self, dashboard: DashboardCreate, user_id: str) -> Dashboard:
        """Create a new dashboard for a user."""
        dashboard_data = dashboard.dict()
        dashboard_id = str(uuid4())
        now = datetime.now()
        
        dashboard_obj = Dashboard(
            id=dashboard_id,
            user_id=user_id,
            created_at=now,
            updated_at=now,
            **dashboard_data
        )
        
        # Here we would save to the database
        # For now, just return the created object
        return dashboard_obj
    
    async def get_dashboard(self, dashboard_id: str, user_id: str) -> Dashboard:
        """Get a dashboard by ID."""
        # Here we would fetch from the database
        # For now, we'll simulate a not found exception
        raise NotFoundException(f"Dashboard with ID {dashboard_id} not found")
    
    async def update_dashboard(self, dashboard_id: str, dashboard: DashboardUpdate, user_id: str) -> Dashboard:
        """Update an existing dashboard."""
        # Fetch the existing dashboard
        existing = await self.get_dashboard(dashboard_id, user_id)
        
        # Update fields
        update_data = dashboard.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(existing, key, value)
        
        existing.updated_at = datetime.now()
        
        # Here we would save to the database
        # For now, just return the updated object
        return existing
    
    async def delete_dashboard(self, dashboard_id: str, user_id: str) -> bool:
        """Delete a dashboard."""
        # Fetch the existing dashboard to ensure it exists and belongs to the user
        existing = await self.get_dashboard(dashboard_id, user_id)
        
        # Here we would delete from the database
        # For now, just return success
        return True
    
    async def list_dashboards(self, user_id: str) -> List[Dashboard]:
        """List all dashboards for a user."""
        # Here we would fetch from the database
        # For now, return an empty list
        return []

    # Report methods
    async def create_report(self, report: ReportCreate, user_id: str) -> Report:
        """Create a new report."""
        report_data = report.dict()
        report_id = str(uuid4())
        now = datetime.now()
        
        report_obj = Report(
            id=report_id,
            user_id=user_id,
            created_at=now,
            updated_at=now,
            **report_data
        )
        
        # Here we would save to the database
        # For now, just return the created object
        return report_obj
    
    async def get_report(self, report_id: str, user_id: str) -> Report:
        """Get a report by ID."""
        # Here we would fetch from the database
        # For now, we'll simulate a not found exception
        raise NotFoundException(f"Report with ID {report_id} not found")
    
    async def update_report(self, report_id: str, report: ReportUpdate, user_id: str) -> Report:
        """Update an existing report."""
        # Fetch the existing report
        existing = await self.get_report(report_id, user_id)
        
        # Update fields
        update_data = report.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(existing, key, value)
        
        existing.updated_at = datetime.now()
        
        # Here we would save to the database
        # For now, just return the updated object
        return existing
    
    async def delete_report(self, report_id: str, user_id: str) -> bool:
        """Delete a report."""
        # Fetch the existing report to ensure it exists and belongs to the user
        existing = await self.get_report(report_id, user_id)
        
        # Here we would delete from the database
        # For now, just return success
        return True
    
    async def list_reports(self, user_id: str, report_type: Optional[ReportType] = None) -> List[Report]:
        """List all reports for a user, optionally filtered by type."""
        # Here we would fetch from the database
        # For now, return an empty list
        return []
    
    async def export_report(self, export_request: ReportExportRequest, user_id: str) -> Dict[str, Any]:
        """Export a report in the specified format."""
        # Fetch the report
        report = await self.get_report(export_request.report_id, user_id)
        
        # Generate the report data
        data = await self.generate_report_data(report, export_request.filters, 
                                          export_request.time_range, export_request.date_range)
        
        # Convert to requested format
        if export_request.format == ReportFormat.JSON:
            # Already in the right format
            return {
                "data": data,
                "format": ReportFormat.JSON,
                "filename": f"{report.name}_{datetime.now().strftime('%Y%m%d')}.json"
            }
        elif export_request.format == ReportFormat.CSV:
            # Convert to CSV format
            # This would involve flattening the data structure and converting to CSV
            return {
                "data": "CSV data would go here",
                "format": ReportFormat.CSV,
                "filename": f"{report.name}_{datetime.now().strftime('%Y%m%d')}.csv"
            }
        elif export_request.format == ReportFormat.EXCEL:
            # Generate Excel file
            return {
                "data": "Excel data would go here",
                "format": ReportFormat.EXCEL,
                "filename": f"{report.name}_{datetime.now().strftime('%Y%m%d')}.xlsx"
            }
        elif export_request.format == ReportFormat.PDF:
            # Generate PDF file
            return {
                "data": "PDF data would go here",
                "format": ReportFormat.PDF,
                "filename": f"{report.name}_{datetime.now().strftime('%Y%m%d')}.pdf"
            }
        
        raise BadRequestException(f"Unsupported export format: {export_request.format}")
    
    async def generate_report_data(self, report: Report, 
                              filters: Optional[List[ReportFilter]] = None,
                              time_range: Optional[TimeRange] = None,
                              date_range: Optional[DateRange] = None) -> Dict[str, Any]:
        """Generate data for a report."""
        # Use provided filters or fall back to report filters
        effective_filters = filters or report.filters
        
        # Use provided time range or fall back to report time_range
        effective_time_range = time_range or report.time_range
        
        # Use provided date range or calculate from time range
        effective_date_range = date_range or report.date_range
        if not effective_date_range and effective_time_range != TimeRange.CUSTOM:
            effective_date_range = self._get_date_range_from_time_range(effective_time_range)
        
        # Generate different report types
        if report.type == ReportType.LEAD_PERFORMANCE:
            return await self.generate_lead_performance_report(effective_filters, effective_date_range)
        elif report.type == ReportType.SALES_PIPELINE:
            return await self.generate_sales_pipeline_report(effective_filters, effective_date_range)
        elif report.type == ReportType.TEAM_PERFORMANCE:
            return await self.generate_team_performance_report(effective_filters, effective_date_range)
        elif report.type == ReportType.CAMPAIGN_PERFORMANCE:
            return await self.generate_campaign_performance_report(effective_filters, effective_date_range)
        elif report.type == ReportType.CONVERSION_RATES:
            return await self.generate_conversion_rates_report(effective_filters, effective_date_range)
        elif report.type == ReportType.ACTIVITY_SUMMARY:
            return await self.generate_activity_summary_report(effective_filters, effective_date_range)
        else:
            # Custom report type
            return await self.generate_custom_report(report, effective_filters, effective_date_range)
    
    # Report generation methods
    async def generate_lead_performance_report(self, filters: List[ReportFilter], date_range: DateRange) -> Dict[str, Any]:
        """Generate lead performance report."""
        # This would typically involve database queries to get lead data
        # For now, return sample data
        return {
            "metrics": [
                Metric(name="Total Leads", value=125, type=MetricType.COUNT),
                Metric(name="New Leads", value=42, type=MetricType.COUNT),
                Metric(name="Conversion Rate", value=0.28, type=MetricType.PERCENTAGE)
            ],
            "chart_data": Chart(
                title="Lead Growth",
                type=ChartType.LINE,
                series=[
                    ChartSeries(
                        name="Leads",
                        data=[
                            DataPoint(x="2023-01", y=80),
                            DataPoint(x="2023-02", y=95),
                            DataPoint(x="2023-03", y=110),
                            DataPoint(x="2023-04", y=125)
                        ]
                    )
                ]
            ),
            "table_data": [
                {"source": "Website", "count": 45, "percentage": "36%"},
                {"source": "Referral", "count": 30, "percentage": "24%"},
                {"source": "Social Media", "count": 25, "percentage": "20%"},
                {"source": "Direct", "count": 15, "percentage": "12%"},
                {"source": "Other", "count": 10, "percentage": "8%"}
            ]
        }
    
    async def generate_sales_pipeline_report(self, filters: List[ReportFilter], date_range: DateRange) -> Dict[str, Any]:
        """Generate sales pipeline report."""
        # Sample data
        return {
            "metrics": [
                Metric(name="Pipeline Value", value=250000, type=MetricType.SUM, formatter="currency"),
                Metric(name="Average Deal Size", value=25000, type=MetricType.AVERAGE, formatter="currency"),
                Metric(name="Conversion Rate", value=0.35, type=MetricType.PERCENTAGE)
            ],
            "chart_data": Chart(
                title="Sales Pipeline by Stage",
                type=ChartType.BAR,
                series=[
                    ChartSeries(
                        name="Value",
                        data=[
                            DataPoint(x="Prospect", y=80000),
                            DataPoint(x="Qualified", y=60000),
                            DataPoint(x="Proposal", y=50000),
                            DataPoint(x="Negotiation", y=40000),
                            DataPoint(x="Closed Won", y=20000)
                        ]
                    )
                ]
            )
        }
    
    async def generate_team_performance_report(self, filters: List[ReportFilter], date_range: DateRange) -> Dict[str, Any]:
        """Generate team performance report."""
        # Sample data
        return {
            "metrics": [
                Metric(name="Total Revenue", value=450000, type=MetricType.SUM, formatter="currency"),
                Metric(name="Deals Closed", value=18, type=MetricType.COUNT),
                Metric(name="Average Deal Cycle", value=28, type=MetricType.AVERAGE, formatter="days")
            ],
            "chart_data": Chart(
                title="Revenue by Team Member",
                type=ChartType.BAR,
                series=[
                    ChartSeries(
                        name="Revenue",
                        data=[
                            DataPoint(x="John Smith", y=120000),
                            DataPoint(x="Jane Doe", y=95000),
                            DataPoint(x="Mark Johnson", y=85000),
                            DataPoint(x="Sarah Williams", y=75000),
                            DataPoint(x="Robert Brown", y=75000)
                        ]
                    )
                ]
            )
        }
    
    async def generate_campaign_performance_report(self, filters: List[ReportFilter], date_range: DateRange) -> Dict[str, Any]:
        """Generate campaign performance report."""
        # Sample data
        return {
            "metrics": [
                Metric(name="Total Campaigns", value=12, type=MetricType.COUNT),
                Metric(name="Total Leads Generated", value=320, type=MetricType.COUNT),
                Metric(name="Cost per Lead", value=45.75, type=MetricType.AVERAGE, formatter="currency"),
                Metric(name="ROI", value=2.8, type=MetricType.RATIO)
            ],
            "chart_data": Chart(
                title="Campaign Performance",
                type=ChartType.BAR,
                series=[
                    ChartSeries(
                        name="Leads",
                        data=[
                            DataPoint(x="Spring Sale", y=85),
                            DataPoint(x="Summer Promo", y=65),
                            DataPoint(x="Fall Webinar", y=55),
                            DataPoint(x="Winter Event", y=40),
                            DataPoint(x="Product Launch", y=75)
                        ]
                    ),
                    ChartSeries(
                        name="Conversion Rate",
                        data=[
                            DataPoint(x="Spring Sale", y=0.32),
                            DataPoint(x="Summer Promo", y=0.28),
                            DataPoint(x="Fall Webinar", y=0.35),
                            DataPoint(x="Winter Event", y=0.25),
                            DataPoint(x="Product Launch", y=0.38)
                        ]
                    )
                ]
            )
        }
    
    async def generate_conversion_rates_report(self, filters: List[ReportFilter], date_range: DateRange) -> Dict[str, Any]:
        """Generate conversion rates report."""
        # Sample data
        return {
            "metrics": [
                Metric(name="Lead to Opportunity", value=0.35, type=MetricType.PERCENTAGE),
                Metric(name="Opportunity to Deal", value=0.42, type=MetricType.PERCENTAGE),
                Metric(name="Overall Conversion", value=0.15, type=MetricType.PERCENTAGE)
            ],
            "chart_data": Chart(
                title="Conversion Funnel",
                type=ChartType.BAR,
                series=[
                    ChartSeries(
                        name="Count",
                        data=[
                            DataPoint(x="Leads", y=500),
                            DataPoint(x="Opportunities", y=175),
                            DataPoint(x="Proposals", y=120),
                            DataPoint(x="Closed Deals", y=75)
                        ]
                    )
                ]
            )
        }
    
    async def generate_activity_summary_report(self, filters: List[ReportFilter], date_range: DateRange) -> Dict[str, Any]:
        """Generate activity summary report."""
        # Sample data
        return {
            "metrics": [
                Metric(name="Total Activities", value=685, type=MetricType.COUNT),
                Metric(name="Calls", value=220, type=MetricType.COUNT),
                Metric(name="Emails", value=380, type=MetricType.COUNT),
                Metric(name="Meetings", value=85, type=MetricType.COUNT)
            ],
            "chart_data": Chart(
                title="Activities by Type",
                type=ChartType.PIE,
                series=[
                    ChartSeries(
                        name="Activities",
                        data=[
                            DataPoint(x="Calls", y=220),
                            DataPoint(x="Emails", y=380),
                            DataPoint(x="Meetings", y=85)
                        ]
                    )
                ]
            )
        }
    
    async def generate_custom_report(self, report: Report, filters: List[ReportFilter], date_range: DateRange) -> Dict[str, Any]:
        """Generate custom report based on report configuration."""
        # Here we would generate a custom report based on the report definition
        # For now, return empty data
        return {
            "metrics": [],
            "chart_data": None,
            "table_data": []
        }
    
    # Analytics API
    async def get_analytics(self, request: AnalyticsRequest, user_id: str) -> AnalyticsResponse:
        """Process an analytics request and return calculated metrics."""
        # Determine date range
        date_range = request.date_range
        if not date_range and request.time_range != TimeRange.CUSTOM:
            date_range = self._get_date_range_from_time_range(request.time_range)
        
        metrics = []
        for metric_name in request.metrics:
            # Here we would calculate each requested metric
            # For now, return dummy data
            metrics.append(
                Metric(
                    name=metric_name,
                    value=100.0,  # Dummy value
                    type=MetricType.COUNT
                )
            )
        
        # Return response
        return AnalyticsResponse(
            metrics=metrics,
            time_range=request.time_range,
            date_range=date_range
        )
    
    # Report schedule methods
    async def create_report_schedule(self, report_id: str, schedule: ReportSchedule, user_id: str) -> ReportSchedule:
        """Create a schedule for automated report delivery."""
        # Verify the report exists and belongs to the user
        report = await self.get_report(report_id, user_id)
        
        schedule_id = str(uuid4())
        now = datetime.now()
        
        schedule_obj = ReportSchedule(
            id=schedule_id,
            report_id=report_id,
            created_at=now,
            updated_at=now,
            **schedule.dict(exclude={"id", "report_id", "created_at", "updated_at", "last_sent"})
        )
        
        # Here we would save to the database
        # For now, just return the created object
        return schedule_obj
    
    async def update_report_schedule(self, schedule_id: str, schedule: ReportSchedule, user_id: str) -> ReportSchedule:
        """Update a report schedule."""
        # Here we would fetch, update, and save the schedule
        # For now, just return the schedule object
        return schedule
    
    async def delete_report_schedule(self, schedule_id: str, user_id: str) -> bool:
        """Delete a report schedule."""
        # Here we would delete the schedule
        # For now, just return success
        return True
    
    async def list_report_schedules(self, report_id: Optional[str] = None, user_id: str = None) -> List[ReportSchedule]:
        """List all report schedules, optionally filtered by report_id."""
        # Here we would fetch schedules from the database
        # For now, return an empty list
        return []
    
    # Dashboard chart methods
    async def add_chart_to_dashboard(self, dashboard_id: str, chart: Chart, user_id: str) -> Dashboard:
        """Add a chart to a dashboard."""
        dashboard = await self.get_dashboard(dashboard_id, user_id)
        
        chart_with_id = chart.copy()
        if not chart_with_id.id:
            chart_with_id.id = str(uuid4())
        
        dashboard.charts.append(chart_with_id)
        dashboard.updated_at = datetime.now()
        
        # Here we would save to the database
        # For now, just return the updated dashboard
        return dashboard
    
    async def update_dashboard_chart(self, dashboard_id: str, chart_id: str, chart: Chart, user_id: str) -> Dashboard:
        """Update a chart on a dashboard."""
        dashboard = await self.get_dashboard(dashboard_id, user_id)
        
        # Find and update the chart
        for i, existing_chart in enumerate(dashboard.charts):
            if existing_chart.id == chart_id:
                # Update chart keeping its ID
                chart_dict = chart.dict(exclude={"id"})
                updated_chart = existing_chart.copy(update=chart_dict)
                dashboard.charts[i] = updated_chart
                dashboard.updated_at = datetime.now()
                
                # Here we would save to the database
                # For now, just return the updated dashboard
                return dashboard
        
        # Chart not found
        raise NotFoundException(f"Chart with ID {chart_id} not found in dashboard {dashboard_id}")
    
    async def remove_chart_from_dashboard(self, dashboard_id: str, chart_id: str, user_id: str) -> Dashboard:
        """Remove a chart from a dashboard."""
        dashboard = await self.get_dashboard(dashboard_id, user_id)
        
        # Find and remove the chart
        original_length = len(dashboard.charts)
        dashboard.charts = [chart for chart in dashboard.charts if chart.id != chart_id]
        
        if len(dashboard.charts) == original_length:
            # No chart was removed
            raise NotFoundException(f"Chart with ID {chart_id} not found in dashboard {dashboard_id}")
        
        dashboard.updated_at = datetime.now()
        
        # Here we would save to the database
        # For now, just return the updated dashboard
        return dashboard 