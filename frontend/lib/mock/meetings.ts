import { Meeting, MeetingStatus, MeetingType } from '@/lib/types/meeting';
import { addDays, addHours, subDays } from 'date-fns';

// Create a base date for today at 9 AM
const today = new Date();
today.setHours(9, 0, 0, 0);

// Create mock meetings data
export const MOCK_MEETINGS: Meeting[] = [
  {
    id: 1,
    title: "Initial Client Meeting",
    description: "Discuss project requirements and timeline",
    start_time: today.toISOString(),
    end_time: addHours(today, 1).toISOString(),
    status: MeetingStatus.SCHEDULED,
    meeting_type: MeetingType.INITIAL_CALL,
    lead_id: 1,
    user_id: 1,
    created_at: subDays(today, 2).toISOString(),
    updated_at: subDays(today, 2).toISOString(),
    location: "Zoom Meeting"
  },
  {
    id: 2,
    title: "Product Demo",
    description: "Demonstrate product features",
    start_time: addDays(today, 3).toISOString(),
    end_time: addHours(addDays(today, 3), 1).toISOString(),
    status: MeetingStatus.CONFIRMED,
    meeting_type: MeetingType.DEMO,
    lead_id: 2,
    user_id: 1,
    created_at: subDays(today, 1).toISOString(),
    updated_at: subDays(today, 1).toISOString(),
    location: "Google Meet"
  },
  {
    id: 3,
    title: "Follow-up Discussion",
    description: "Follow up on previous meeting",
    start_time: addDays(today, 7).toISOString(),
    end_time: addHours(addDays(today, 7), 1).toISOString(),
    status: MeetingStatus.SCHEDULED,
    meeting_type: MeetingType.FOLLOW_UP,
    lead_id: 3,
    user_id: 1,
    created_at: subDays(today, 3).toISOString(),
    updated_at: subDays(today, 3).toISOString(),
    location: "Phone Call"
  },
  {
    id: 4,
    title: "Proposal Review",
    description: "Review the proposal with the client",
    start_time: addHours(today, 3).toISOString(),
    end_time: addHours(today, 4).toISOString(),
    status: MeetingStatus.SCHEDULED,
    meeting_type: MeetingType.PROPOSAL,
    lead_id: 2,
    user_id: 1,
    created_at: subDays(today, 5).toISOString(),
    updated_at: subDays(today, 5).toISOString(),
    location: "Office"
  },
  {
    id: 5,
    title: "Contract Negotiation",
    description: "Negotiate contract terms",
    start_time: addDays(addHours(today, 2), 1).toISOString(),
    end_time: addDays(addHours(today, 3), 1).toISOString(),
    status: MeetingStatus.SCHEDULED,
    meeting_type: MeetingType.NEGOTIATION,
    lead_id: 4,
    user_id: 1,
    created_at: subDays(today, 4).toISOString(),
    updated_at: subDays(today, 4).toISOString(),
    location: "Client Office"
  },
  {
    id: 6,
    title: "Project Kickoff",
    description: "Kickoff meeting for the new project",
    start_time: addDays(today, 10).toISOString(),
    end_time: addHours(addDays(today, 10), 2).toISOString(),
    status: MeetingStatus.SCHEDULED,
    meeting_type: MeetingType.OTHER,
    lead_id: 5,
    user_id: 1,
    created_at: subDays(today, 7).toISOString(),
    updated_at: subDays(today, 7).toISOString(),
    location: "Conference Room"
  },
  {
    id: 7,
    title: "Canceled Meeting",
    description: "This meeting was canceled",
    start_time: addDays(today, 2).toISOString(),
    end_time: addHours(addDays(today, 2), 1).toISOString(),
    status: MeetingStatus.CANCELED,
    meeting_type: MeetingType.DISCOVERY,
    lead_id: 6,
    user_id: 1,
    created_at: subDays(today, 8).toISOString(),
    updated_at: subDays(today, 1).toISOString(),
    location: "Zoom Meeting"
  },
  {
    id: 8,
    title: "Completed Meeting",
    description: "This meeting has been completed",
    start_time: subDays(today, 1).toISOString(),
    end_time: addHours(subDays(today, 1), 1).toISOString(),
    status: MeetingStatus.COMPLETED,
    meeting_type: MeetingType.FOLLOW_UP,
    lead_id: 7,
    user_id: 1,
    created_at: subDays(today, 10).toISOString(),
    updated_at: subDays(today, 1).toISOString(),
    location: "Phone Call"
  }
]; 