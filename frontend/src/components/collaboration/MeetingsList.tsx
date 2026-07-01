import React, { useEffect, useState } from 'react';
import { getMeetingsForUser, updateMeetingStatus, Meeting } from '../../data/meetings';
import { useAuth } from '../../context/AuthContext';

export const MeetingsList: React.FC = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  // Fetch meetings from our local data layer
  const loadMeetings = () => {
    if (user) {
      const data = getMeetingsForUser(Number(user.id));
      setMeetings(data);
    }
  };

  useEffect(() => {
    loadMeetings();
    
    // Listen for updates across windows/tabs or components
    window.addEventListener('storage', loadMeetings);
    return () => window.removeEventListener('storage', loadMeetings);
  }, [user]);

  const handleStatusChange = (meetingId: string, status: 'accepted' | 'rejected') => {
    const success = updateMeetingStatus(meetingId, status);
    if (success) {
      loadMeetings(); // Real-time UI refresh
    }
  };

  if (!user) return null;

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">Your Scheduled Meetings</h3>
        <p className="text-xs text-gray-500">Track and manage your upcoming investor syncs</p>
      </div>

      {meetings.length === 0 ? (
        <div className="text-center py-6 text-gray-500 text-sm">
          No meetings scheduled yet.
        </div>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <div 
              key={meeting.id} 
              className="p-4 border border-gray-100 rounded-xl hover:shadow-sm transition-all bg-gray-50/50"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider mb-2 ${
                    meeting.status === 'accepted' ? 'bg-green-50 text-green-700 border border-green-200' :
                    meeting.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
                    'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {meeting.status}
                  </span>
                  <h4 className="text-sm font-bold text-gray-900">{meeting.title}</h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    With: <span className="font-medium text-gray-800">{meeting.participantName}</span>
                  </p>
                  {meeting.description && (
                    <p className="text-xs text-gray-500 mt-2 italic bg-white p-2 rounded border border-gray-100">
                      {meeting.description}
                    </p>
                  )}
                </div>

                <div className="text-left sm:text-right flex flex-col sm:items-end justify-between min-w-[120px]">
                  <div className="text-xs text-gray-500 font-medium">
                    📅 {meeting.date} <br /> 🕒 {meeting.time}
                  </div>

                  {/* Actions visible only for pending receiving requests */}
                  {meeting.status === 'pending' && meeting.receiverId === Number(user.id) && (
  <div className="flex gap-1.5 mt-3 sm:mt-2 w-full">
    <button
      onClick={() => handleStatusChange(meeting.id, 'accepted')}
      className="flex-1 text-center py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors"
    >
      Accept
    </button>
    <button
      onClick={() => handleStatusChange(meeting.id, 'rejected')}
      className="flex-1 text-center py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300 transition-colors"
    >
      Decline
    </button>
  </div>
)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};