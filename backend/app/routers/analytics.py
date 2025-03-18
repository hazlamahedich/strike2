"""
Analytics router for dashboard and reporting endpoints.
"""
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query, Path, HTTPException, status
from fastapi.responses import JSONResponse

from ..models.analytics import (
    Dashboard, DashboardCreate, DashboardUpdate,
    Report, ReportCreate, ReportUpdate, ReportType,
    ReportSchedule, ReportExportRequest, ReportFormat,
    Chart, ChartType, ChartSeries, DataPoint,
    AnalyticsRequest, AnalyticsResponse,
    DateRange, 
    LeadAnalytics, 
    CampaignAnalytics, 
    ConversionFunnel,
    AnalysisRecommendation,
    TimeRange
)
from ..services.analytics import AnalyticsService
from ..core.security import get_current_user, get_current_active_user
from ..models.user import User
from ..core.exceptions import NotFoundException, BadRequestException, ResourceNotFoundException, PermissionDeniedException

router = APIRouter(
    prefix="/analytics",
    tags=["analytics"],
    responses={404: {"description": "Not found"}},
)

analytics_service = AnalyticsService()


# Dashboard endpoints
@router.post("/dashboards", response_model=Dashboard, status_code=status.HTTP_201_CREATED)
async def create_dashboard(
    dashboard: DashboardCreate, 
    current_user: User = Depends(get_current_user)
) -> Dashboard:
    """Create a new dashboard."""
    return await analytics_service.create_dashboard(dashboard, current_user.id)


@router.get("/dashboards", response_model=List[Dashboard])
async def list_dashboards(
    current_user: User = Depends(get_current_user)
) -> List[Dashboard]:
    """List all dashboards for the current user."""
    return await analytics_service.list_dashboards(current_user.id)


@router.get("/dashboards/{dashboard_id}", response_model=Dashboard)
async def get_dashboard(
    dashboard_id: str = Path(..., description="The ID of the dashboard to get"),
    current_user: User = Depends(get_current_user)
) -> Dashboard:
    """Get a specific dashboard."""
    try:
        return await analytics_service.get_dashboard(dashboard_id, current_user.id)
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.put("/dashboards/{dashboard_id}", response_model=Dashboard)
async def update_dashboard(
    dashboard: DashboardUpdate,
    dashboard_id: str = Path(..., description="The ID of the dashboard to update"),
    current_user: User = Depends(get_current_user)
) -> Dashboard:
    """Update a dashboard."""
    try:
        return await analytics_service.update_dashboard(dashboard_id, dashboard, current_user.id)
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/dashboards/{dashboard_id}", response_model=Dict[str, bool])
async def delete_dashboard(
    dashboard_id: str = Path(..., description="The ID of the dashboard to delete"),
    current_user: User = Depends(get_current_user)
) -> Dict[str, bool]:
    """Delete a dashboard."""
    try:
        success = await analytics_service.delete_dashboard(dashboard_id, current_user.id)
        return {"success": success}
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# Dashboard chart endpoints
@router.post("/dashboards/{dashboard_id}/charts", response_model=Dashboard)
async def add_chart_to_dashboard(
    chart: Chart,
    dashboard_id: str = Path(..., description="The ID of the dashboard"),
    current_user: User = Depends(get_current_user)
) -> Dashboard:
    """Add a chart to a dashboard."""
    try:
        return await analytics_service.add_chart_to_dashboard(dashboard_id, chart, current_user.id)
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.put("/dashboards/{dashboard_id}/charts/{chart_id}", response_model=Dashboard)
async def update_dashboard_chart(
    chart: Chart,
    dashboard_id: str = Path(..., description="The ID of the dashboard"),
    chart_id: str = Path(..., description="The ID of the chart to update"),
    current_user: User = Depends(get_current_user)
) -> Dashboard:
    """Update a chart on a dashboard."""
    try:
        return await analytics_service.update_dashboard_chart(dashboard_id, chart_id, chart, current_user.id)
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/dashboards/{dashboard_id}/charts/{chart_id}", response_model=Dashboard)
async def remove_chart_from_dashboard(
    dashboard_id: str = Path(..., description="The ID of the dashboard"),
    chart_id: str = Path(..., description="The ID of the chart to remove"),
    current_user: User = Depends(get_current_user)
) -> Dashboard:
    """Remove a chart from a dashboard."""
    try:
        return await analytics_service.remove_chart_from_dashboard(dashboard_id, chart_id, current_user.id)
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# Report endpoints
@router.post("/reports", response_model=Report, status_code=status.HTTP_201_CREATED)
async def create_report(
    report: ReportCreate,
    current_user: User = Depends(get_current_user)
) -> Report:
    """Create a new report."""
    return await analytics_service.create_report(report, current_user.id)


@router.get("/reports", response_model=List[Report])
async def list_reports(
    report_type: Optional[ReportType] = Query(None, description="Filter by report type"),
    current_user: User = Depends(get_current_user)
) -> List[Report]:
    """List all reports for the current user, optionally filtered by type."""
    return await analytics_service.list_reports(current_user.id, report_type)


@router.get("/reports/{report_id}", response_model=Report)
async def get_report(
    report_id: str = Path(..., description="The ID of the report to get"),
    current_user: User = Depends(get_current_user)
) -> Report:
    """Get a specific report."""
    try:
        return await analytics_service.get_report(report_id, current_user.id)
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.put("/reports/{report_id}", response_model=Report)
async def update_report(
    report: ReportUpdate,
    report_id: str = Path(..., description="The ID of the report to update"),
    current_user: User = Depends(get_current_user)
) -> Report:
    """Update a report."""
    try:
        return await analytics_service.update_report(report_id, report, current_user.id)
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/reports/{report_id}", response_model=Dict[str, bool])
async def delete_report(
    report_id: str = Path(..., description="The ID of the report to delete"),
    current_user: User = Depends(get_current_user)
) -> Dict[str, bool]:
    """Delete a report."""
    try:
        success = await analytics_service.delete_report(report_id, current_user.id)
        return {"success": success}
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/reports/export", response_model=Dict[str, Any])
async def export_report(
    export_request: ReportExportRequest,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Export a report in the specified format."""
    try:
        return await analytics_service.export_report(export_request, current_user.id)
    except (NotFoundException, BadRequestException) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# Report schedule endpoints
@router.post("/reports/{report_id}/schedules", response_model=ReportSchedule, status_code=status.HTTP_201_CREATED)
async def create_report_schedule(
    schedule: ReportSchedule,
    report_id: str = Path(..., description="The ID of the report"),
    current_user: User = Depends(get_current_user)
) -> ReportSchedule:
    """Create a schedule for automated report delivery."""
    try:
        return await analytics_service.create_report_schedule(report_id, schedule, current_user.id)
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/reports/schedules", response_model=List[ReportSchedule])
async def list_report_schedules(
    report_id: Optional[str] = Query(None, description="Filter by report ID"),
    current_user: User = Depends(get_current_user)
) -> List[ReportSchedule]:
    """List all report schedules for the current user, optionally filtered by report ID."""
    return await analytics_service.list_report_schedules(report_id, current_user.id)


@router.put("/reports/schedules/{schedule_id}", response_model=ReportSchedule)
async def update_report_schedule(
    schedule: ReportSchedule,
    schedule_id: str = Path(..., description="The ID of the schedule to update"),
    current_user: User = Depends(get_current_user)
) -> ReportSchedule:
    """Update a report schedule."""
    try:
        return await analytics_service.update_report_schedule(schedule_id, schedule, current_user.id)
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/reports/schedules/{schedule_id}", response_model=Dict[str, bool])
async def delete_report_schedule(
    schedule_id: str = Path(..., description="The ID of the schedule to delete"),
    current_user: User = Depends(get_current_user)
) -> Dict[str, bool]:
    """Delete a report schedule."""
    try:
        success = await analytics_service.delete_report_schedule(schedule_id, current_user.id)
        return {"success": success}
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# Analytics metrics endpoints
@router.post("/metrics", response_model=AnalyticsResponse)
async def get_analytics(
    request: AnalyticsRequest,
    current_user: User = Depends(get_current_user)
) -> AnalyticsResponse:
    """Get analytics metrics based on the request parameters."""
    try:
        return await analytics_service.get_analytics(request, current_user.id)
    except BadRequestException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/leads", response_model=LeadAnalytics)
async def get_lead_analytics(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    lead_id: Optional[int] = Query(None),
    group_by: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get analytics for leads
    """
    # Set default date range if not provided
    if not start_date:
        start_date = datetime.now() - timedelta(days=30)
    if not end_date:
        end_date = datetime.now()
    
    date_range = DateRange(start_date=start_date, end_date=end_date)
    
    try:
        return await AnalyticsService.get_lead_analytics(
            user_id=current_user.id,
            date_range=date_range,
            lead_id=lead_id,
            group_by=group_by
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving lead analytics: {str(e)}")


@router.get("/campaigns", response_model=CampaignAnalytics)
async def get_campaign_analytics(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    campaign_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get analytics for marketing campaigns
    """
    # Set default date range if not provided
    if not start_date:
        start_date = datetime.now() - timedelta(days=30)
    if not end_date:
        end_date = datetime.now()
    
    date_range = DateRange(start_date=start_date, end_date=end_date)
    
    try:
        return await AnalyticsService.get_campaign_analytics(
            user_id=current_user.id,
            date_range=date_range,
            campaign_id=campaign_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving campaign analytics: {str(e)}")


@router.get("/conversion-funnel", response_model=ConversionFunnel)
async def get_conversion_funnel(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    campaign_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_active_user)
):
    """Get conversion funnel analytics."""
    try:
        # Create date range
        if not start_date:
            start_date = datetime.now() - timedelta(days=30)
        if not end_date:
            end_date = datetime.now()
        
        date_range = DateRange(start_date=start_date, end_date=end_date)
        
        return await analytics_service.get_conversion_funnel(
            user_id=current_user.id,
            date_range=date_range,
            campaign_id=campaign_id
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/insights", response_model=AnalysisRecommendation)
async def get_analytics_insights(
    time_range: Optional[TimeRange] = Query(None, description="Predefined time range"),
    start_date: Optional[datetime] = Query(None, description="Custom start date"),
    end_date: Optional[datetime] = Query(None, description="Custom end date"),
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate AI-powered insights and recommendations based on analytics data.
    
    This endpoint analyzes your CRM data using AI to provide strategic insights,
    identify strengths, weaknesses, opportunities, and make actionable recommendations.
    
    You can specify either a predefined time range or a custom date range.
    """
    try:
        date_range = None
        
        # If custom dates are provided, use them
        if start_date and end_date:
            date_range = DateRange(start_date=start_date, end_date=end_date)
        
        # Generate AI-powered insights
        insights = await analytics_service.generate_analytics_insights(
            user_id=current_user.id,
            time_range=time_range,
            date_range=date_range
        )
        
        return insights
    except Exception as e:
        logger.error(f"Error generating analytics insights: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Failed to generate analytics insights: {str(e)}"
        ) 