import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/auth/meetings/';

// Fetch all meetings linked to the logged-in user
export const fetchMeetings = async (token: string) => {
  const response = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Accept a pending meeting invite
export const acceptMeeting = async (meetingId: number, token: string) => {
  const response = await axios.post(`${API_URL}${meetingId}/accept/`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Reject/Cancel a meeting request
export const rejectMeeting = async (meetingId: number, token: string) => {
  const response = await axios.post(`${API_URL}${meetingId}/reject/`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};