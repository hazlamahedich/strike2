"""
Analytics service for generating reports, dashboards, and metrics.
This service provides functionality for creating and managing analytics 
dashboards, reports, and generating metrics from CRM data.
"""
import logging
from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Any, Union, Tuple
from uuid import uuid4
import json

from sqlalchemy import text, func, desc, asc
from sqlalchemy.orm import Session

from ..models.analytics import (
    Dashboard, DashboardCreate, DashboardUpdate,
    Report, ReportCreate, ReportUpdate, ReportType,
    ReportSchedule, ReportExportRequest, ReportFormat,
    Chart, ChartType, ChartSeries, DataPoint,
    Metric, MetricType, TimeRange, DateRange,
    Dimension, ReportFilter, AnalyticsRequest, AnalyticsResponse,
    LeadAnalytics, 
    CampaignAnalytics, 
    UserPerformance,
    ConversionFunnel,
    TimeSeriesMetric
)
from ..core.database import get_db, fetch_one, fetch_all
from ..core.exceptions import NotFoundException, BadRequestException, ResourceNotFoundException, DatabaseException

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

    @staticmethod
    async def get_lead_analytics(
        user_id: int,
        date_range: DateRange,
        lead_id: Optional[int] = None,
        group_by: Optional[str] = None
    ) -> LeadAnalytics:
        """
        Get analytics for leads
        
        Args:
            user_id: ID of the user requesting analytics
            date_range: Date range for the analytics
            lead_id: Optional specific lead ID to analyze
            group_by: Optional grouping (e.g., 'status', 'source', 'campaign')
            
        Returns:
            LeadAnalytics object with the requested metrics
        """
        try:
            # Base query parts
            select_clause = """
                COUNT(*) as total_leads,
                COUNT(CASE WHEN status = 'qualified' THEN 1 END) as qualified_leads,
                COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted_leads,
                AVG(EXTRACT(EPOCH FROM (COALESCE(converted_at, CURRENT_TIMESTAMP) - created_at))) as avg_time_to_conversion
            """
            
            from_clause = "FROM leads"
            
            where_conditions = [
                "created_at >= $1",
                "created_at <= $2"
            ]
            
            params = [date_range.start_date, date_range.end_date]
            
            # Add lead_id condition if specified
            if lead_id:
                where_conditions.append(f"id = ${len(params) + 1}")
                params.append(lead_id)
            
            # Add user_id condition (for multi-tenant systems)
            where_conditions.append(f"user_id = ${len(params) + 1}")
            params.append(user_id)
            
            where_clause = "WHERE " + " AND ".join(where_conditions)
            
            # Handle grouping
            group_clause = ""
            if group_by:
                valid_group_fields = ['status', 'source', 'campaign_id', 'assigned_to']
                if group_by not in valid_group_fields:
                    raise ValueError(f"Invalid group_by value. Must be one of: {', '.join(valid_group_fields)}")
                
                select_clause = f"{group_by}, " + select_clause
                group_clause = f"GROUP BY {group_by}"
            
            # Construct the full query
            query = f"""
                SELECT {select_clause}
                {from_clause}
                {where_clause}
                {group_clause}
            """
            
            # Execute the query
            if group_by:
                results = await fetch_all(query, *params)
                
                # Process grouped results
                metrics_by_group = {}
                for row in results:
                    group_value = row[group_by]
                    metrics_by_group[group_value] = {
                        "total_leads": row["total_leads"],
                        "qualified_leads": row["qualified_leads"],
                        "converted_leads": row["converted_leads"],
                        "conversion_rate": row["converted_leads"] / row["total_leads"] if row["total_leads"] > 0 else 0,
                        "avg_time_to_conversion": row["avg_time_to_conversion"]
                    }
                
                # Time series data for lead creation
                time_series_query = f"""
                    SELECT 
                        DATE_TRUNC('day', created_at) as date,
                        COUNT(*) as value
                    FROM leads
                    {where_clause}
                    GROUP BY DATE_TRUNC('day', created_at)
                    ORDER BY DATE_TRUNC('day', created_at)
                """
                
                time_series_data = await fetch_all(time_series_query, *params)
                leads_over_time = [
                    {"date": row["date"], "value": row["value"]}
                    for row in time_series_data
                ]
                
                return LeadAnalytics(
                    grouped_metrics=metrics_by_group,
                    leads_over_time=leads_over_time,
                    date_range=date_range
                )
            else:
                result = await fetch_one(query, *params)
                
                if not result:
                    # Return empty analytics if no data found
                    return LeadAnalytics(
                        total_leads=0,
                        new_leads=0,
                        qualified_leads=0,
                        converted_leads=0,
                        conversion_rate=0,
                        avg_time_to_conversion=0,
                        leads_over_time=[],
                        date_range=date_range
                    )
                
                # Get new leads count (separate query)
                new_leads_query = f"""
                    SELECT COUNT(*) as new_leads
                    FROM leads
                    WHERE created_at >= $1 AND created_at <= $2
                    AND user_id = $3
                """
                new_leads_result = await fetch_one(new_leads_query, date_range.start_date, date_range.end_date, user_id)
                
                # Time series data for lead creation
                time_series_query = f"""
                    SELECT 
                        DATE_TRUNC('day', created_at) as date,
                        COUNT(*) as value
                    FROM leads
                    WHERE created_at >= $1 AND created_at <= $2
                    AND user_id = $3
                    GROUP BY DATE_TRUNC('day', created_at)
                    ORDER BY DATE_TRUNC('day', created_at)
                """
                
                time_series_data = await fetch_all(time_series_query, date_range.start_date, date_range.end_date, user_id)
                leads_over_time = [
                    TimeSeriesMetric(date=row["date"], value=row["value"])
                    for row in time_series_data
                ]
                
                # Calculate conversion rate
                conversion_rate = result["converted_leads"] / result["total_leads"] if result["total_leads"] > 0 else 0
                
                return LeadAnalytics(
                    total_leads=result["total_leads"],
                    new_leads=new_leads_result["new_leads"],
                    qualified_leads=result["qualified_leads"],
                    converted_leads=result["converted_leads"],
                    conversion_rate=conversion_rate,
                    avg_time_to_conversion=result["avg_time_to_conversion"],
                    leads_over_time=leads_over_time,
                    date_range=date_range
                )
                
        except Exception as e:
            logger.error(f"Error getting lead analytics: {e}")
            raise DatabaseException(f"Failed to retrieve lead analytics: {str(e)}")
    
    @staticmethod
    async def get_campaign_analytics(
        user_id: int,
        date_range: DateRange,
        campaign_id: Optional[int] = None
    ) -> CampaignAnalytics:
        """
        Get analytics for marketing campaigns
        
        Args:
            user_id: ID of the user requesting analytics
            date_range: Date range for the analytics
            campaign_id: Optional specific campaign ID to analyze
            
        Returns:
            CampaignAnalytics object with the campaign metrics
        """
        try:
            # Base query parts for campaigns
            select_clause = """
                c.id,
                c.name,
                c.start_date,
                c.end_date,
                c.status,
                COUNT(cl.lead_id) as total_leads,
                COUNT(CASE WHEN l.status = 'qualified' THEN 1 END) as qualified_leads,
                COUNT(CASE WHEN l.status = 'converted' THEN 1 END) as converted_leads,
                SUM(CASE WHEN i.type = 'email' AND i.action = 'opened' THEN 1 ELSE 0 END) as email_opens,
                SUM(CASE WHEN i.type = 'email' AND i.action = 'clicked' THEN 1 ELSE 0 END) as email_clicks,
                COUNT(DISTINCT cl.lead_id) as unique_leads
            """
            
            from_clause = """
                FROM campaigns c
                LEFT JOIN campaign_leads cl ON c.id = cl.campaign_id
                LEFT JOIN leads l ON cl.lead_id = l.id
                LEFT JOIN interactions i ON l.id = i.lead_id AND i.created_at BETWEEN c.start_date AND COALESCE(c.end_date, CURRENT_TIMESTAMP)
            """
            
            where_conditions = [
                "c.start_date >= $1",
                "c.start_date <= $2 OR (c.start_date <= $2 AND (c.end_date >= $1 OR c.end_date IS NULL))"
            ]
            
            params = [date_range.start_date, date_range.end_date]
            
            # Add campaign_id condition if specified
            if campaign_id:
                where_conditions.append(f"c.id = ${len(params) + 1}")
                params.append(campaign_id)
            
            # Add user_id condition
            where_conditions.append(f"c.user_id = ${len(params) + 1}")
            params.append(user_id)
            
            where_clause = "WHERE " + " AND ".join(where_conditions)
            
            # Group and order
            group_order_clause = "GROUP BY c.id ORDER BY c.start_date DESC"
            
            # Construct the full query
            query = f"""
                SELECT {select_clause}
                {from_clause}
                {where_clause}
                {group_order_clause}
            """
            
            # Execute the query
            results = await fetch_all(query, *params)
            
            if not results:
                # Return empty analytics if no data found
                return CampaignAnalytics(
                    campaigns=[],
                    total_campaigns=0,
                    total_leads_generated=0,
                    avg_conversion_rate=0,
                    date_range=date_range
                )
            
            # Process results into campaign analytics
            campaigns = []
            total_leads = 0
            total_conversions = 0
            
            for row in results:
                opens = row["email_opens"] or 0
                clicks = row["email_clicks"] or 0
                sent = row["total_leads"] or 0
                
                # Calculate metrics
                open_rate = opens / sent if sent > 0 else 0
                click_rate = clicks / opens if opens > 0 else 0
                conversion_rate = row["converted_leads"] / row["total_leads"] if row["total_leads"] > 0 else 0
                
                # Accumulate totals
                total_leads += row["total_leads"]
                total_conversions += row["converted_leads"]
                
                campaigns.append({
                    "id": row["id"],
                    "name": row["name"],
                    "start_date": row["start_date"],
                    "end_date": row["end_date"],
                    "status": row["status"],
                    "total_leads": row["total_leads"],
                    "qualified_leads": row["qualified_leads"],
                    "converted_leads": row["converted_leads"],
                    "conversion_rate": conversion_rate,
                    "email_metrics": {
                        "opens": opens,
                        "clicks": clicks,
                        "open_rate": open_rate,
                        "click_rate": click_rate
                    }
                })
            
            # Calculate overall conversion rate
            avg_conversion_rate = total_conversions / total_leads if total_leads > 0 else 0
            
            return CampaignAnalytics(
                campaigns=campaigns,
                total_campaigns=len(campaigns),
                total_leads_generated=total_leads,
                avg_conversion_rate=avg_conversion_rate,
                date_range=date_range
            )
                
        except Exception as e:
            logger.error(f"Error getting campaign analytics: {e}")
            raise DatabaseException(f"Failed to retrieve campaign analytics: {str(e)}")
    
    @staticmethod
    async def get_user_performance(
        user_id: int,
        date_range: DateRange,
        team_id: Optional[int] = None
    ) -> List[UserPerformance]:
        """
        Get performance metrics for users/sales reps
        
        Args:
            user_id: ID of the user requesting analytics (must have appropriate permissions)
            date_range: Date range for the analytics
            team_id: Optional team ID to filter users
            
        Returns:
            List of UserPerformance objects with performance metrics
        """
        # This would typically require admin/manager permissions
        # Implementation would be similar to the other analytics methods
        
        # For now, return a placeholder
        raise NotImplementedError("User performance analytics not implemented yet")
    
    @staticmethod
    async def get_conversion_funnel(
        user_id: int,
        date_range: DateRange,
        campaign_id: Optional[int] = None
    ) -> ConversionFunnel:
        """
        Get conversion funnel analytics
        
        Args:
            user_id: ID of the user requesting analytics
            date_range: Date range for the analytics
            campaign_id: Optional campaign ID to filter leads
            
        Returns:
            ConversionFunnel object with funnel stage metrics
        """
        try:
            # Define funnel stages
            stages = [
                "new", "contacted", "engaged", "qualified", "proposal", "negotiation", "converted", "lost"
            ]
            
            # Base query parts
            where_conditions = [
                "created_at >= $1",
                "created_at <= $2",
                "user_id = $3"
            ]
            
            params = [date_range.start_date, date_range.end_date, user_id]
            
            # Add campaign_id condition if specified
            if campaign_id:
                where_conditions.append("""
                    id IN (
                        SELECT lead_id 
                        FROM campaign_leads 
                        WHERE campaign_id = $4
                    )
                """)
                params.append(campaign_id)
            
            where_clause = "WHERE " + " AND ".join(where_conditions)
            
            # Construct the query to count leads in each stage
            stage_counts_query = f"""
                SELECT 
                    status,
                    COUNT(*) as count
                FROM leads
                {where_clause}
                GROUP BY status
                ORDER BY 
                    CASE 
                        WHEN status = 'new' THEN 1
                        WHEN status = 'contacted' THEN 2
                        WHEN status = 'engaged' THEN 3
                        WHEN status = 'qualified' THEN 4
                        WHEN status = 'proposal' THEN 5
                        WHEN status = 'negotiation' THEN 6
                        WHEN status = 'converted' THEN 7
                        WHEN status = 'lost' THEN 8
                        ELSE 9
                    END
            """
            
            # Execute the query
            results = await fetch_all(stage_counts_query, *params)
            
            # Process results into funnel stages
            stage_counts = {stage: 0 for stage in stages}
            for row in results:
                if row["status"] in stage_counts:
                    stage_counts[row["status"]] = row["count"]
            
            # Calculate conversion rates between stages
            funnel_stages = []
            previous_count = None
            
            for stage in stages:
                count = stage_counts.get(stage, 0)
                conversion_rate = None
                
                if previous_count is not None and previous_count > 0:
                    conversion_rate = count / previous_count
                
                funnel_stages.append({
                    "name": stage,
                    "count": count,
                    "conversion_rate": conversion_rate
                })
                
                previous_count = count
            
            # Calculate overall conversion rate (new to converted)
            total_new = stage_counts.get("new", 0)
            total_converted = stage_counts.get("converted", 0)
            overall_conversion_rate = total_converted / total_new if total_new > 0 else 0
            
            return ConversionFunnel(
                stages=funnel_stages,
                overall_conversion_rate=overall_conversion_rate,
                date_range=date_range
            )
                
        except Exception as e:
            logger.error(f"Error getting conversion funnel: {e}")
            raise DatabaseException(f"Failed to retrieve conversion funnel: {str(e)}") 