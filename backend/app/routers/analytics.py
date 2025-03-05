"""
Analytics router for dashboard and reporting endpoints.
"""
from typing import Dict, List, Optional, Any

from fastapi import APIRouter, Depends, Query, Path, HTTPException, status
from fastapi.responses import JSONResponse

from ..models.analytics import (
    Dashboard, DashboardCreate, DashboardUpdate,
    Report, ReportCreate, ReportUpdate, ReportType,
    ReportSchedule, ReportExportRequest, ReportFormat,
    Chart, ChartType, ChartSeries, DataPoint,
    AnalyticsRequest, AnalyticsResponse
)
from ..services.analytics import AnalyticsService
from ..core.security import get_current_user
from ..models.user import User
from ..core.exceptions import NotFoundException, BadRequestException

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