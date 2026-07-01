// 1. Single Interface definition
export interface Meeting {
  id: string;
  senderId: number;       // ID of the requester
  receiverId: number;     // ID of the recipient
  participantName: string;
  title: string;
  date: string;
  time: string;
  description?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'confirmed'; 
}

// 2. Updated Initial Data
export const INITIAL_MEETINGS: Meeting[] = [
  {
    id: 'meet-1',
    senderId: 1, 
    receiverId: 2,
    participantName: 'Alpha Ventures',
    title: 'Initial Pitch Review',
    date: '2026-07-10',
    time: '14:00',
    description: 'Going over core architecture.',
    status: 'pending',
  },
  {
    id: 'm1',
    senderId: 1, // Mapping entrepreneurId to senderId
    receiverId: 2, // Mapping investorId to receiverId
    participantName: 'Sami Startup Labs',
    title: 'Seed Round Alignment',
    date: '2026-07-15',
    time: '11:30',
    description: 'Alignment meeting.',
    status: 'confirmed',
  }
];

// Helper to initialize LocalStorage
const getStoredMeetings = (): Meeting[] => {
  const stored = localStorage.getItem('mock_meetings');
  if (!stored) {
    localStorage.setItem('mock_meetings', JSON.stringify(INITIAL_MEETINGS));
    return INITIAL_MEETINGS;
  }
  return JSON.parse(stored);
};

// 3. Updated Functions
export const getMeetingsForUser = (userId: number): Meeting[] => {
  const meetings = getStoredMeetings();
  return meetings.filter(m => m.senderId === userId || m.receiverId === userId);
};

export const saveMeetingRequest = (meetingData: Omit<Meeting, 'id' | 'status'>): Meeting => {
  const meetings = getStoredMeetings();
  const newMeeting: Meeting = {
    ...meetingData,
    id: `meet-${Date.now()}`,
    status: 'pending'
  };
  
  meetings.push(newMeeting);
  localStorage.setItem('mock_meetings', JSON.stringify(meetings));
  return newMeeting;
};

export const updateMeetingStatus = (meetingId: string, status: Meeting['status']): boolean => {
  const meetings = getStoredMeetings();
  const index = meetings.findIndex(m => m.id === meetingId);
  
  if (index !== -1) {
    meetings[index].status = status;
    localStorage.setItem('mock_meetings', JSON.stringify(meetings));
    return true;
  }
  return false;
};