import API from './api';

export interface CreateMeetingPayload {
  participant: number;
  title: string;
  description?: string;
  start_time: string; // ISO datetime string
  end_time: string;   // ISO datetime string
}

// Fetch all meetings linked to the logged-in user (as organizer or participant)
export const fetchMeetings = async () => {
  const response = await API.get('auth/meetings/');
  // Backend uses pagination, so the real list is inside `results`
  return response.data.results ?? response.data;
};

// Schedule a new meeting (runs backend conflict detection automatically)
export const createMeeting = async (payload: CreateMeetingPayload) => {
  const response = await API.post('auth/meetings/', payload);
  return response.data;
};

// Accept a pending meeting invite (only the participant can do this)
export const acceptMeeting = async (meetingId: number) => {
  const response = await API.post(`auth/meetings/${meetingId}/accept/`);
  return response.data;
};

// Reject a pending meeting invite (only the participant can do this)
export const rejectMeeting = async (meetingId: number) => {
  const response = await API.post(`auth/meetings/${meetingId}/reject/`);
  return response.data;
};