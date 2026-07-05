import React, { useEffect, useState } from 'react';
import { fetchMeetings, acceptMeeting, rejectMeeting } from '../../services/meetingService';
import { useAuth } from '../../context/AuthContext';

interface MeetingsListProps {
  onJoinCall: (roomId: string) => void;
}

export const MeetingsList: React.FC<MeetingsListProps> = ({ onJoinCall }) => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const data = await fetchMeetings();
      setMeetings(data);
      setError('');
    } catch (err) {
      setError('Failed to load meetings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadMeetings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleAccept = async (meetingId: number) => {
    try {
      await acceptMeeting(meetingId);
      loadMeetings();
    } catch (err) {
      setError('Failed to accept meeting.');
    }
  };

  const handleReject = async (meetingId: number) => {
    try {
      await rejectMeeting(meetingId);
      loadMeetings();
    } catch (err) {
      setError('Failed to reject meeting.');
    }
  };

  if (!user) return null;

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">Your Scheduled Meetings</h3>
        <p className="text-xs text-gray-500">Track and manage your upcoming investor syncs</p>
      </div>

      {error && (
        <div className="mb-3 p-2 rounded-md text-sm bg-red-100 text-red-800 border border-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-6 text-gray-500 text-sm">Loading...</div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-6 text-gray-500 text-sm">
          No meetings scheduled yet.
        </div>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting) => {
            const isParticipant = String(meeting.participant) === String(user.id);
            const otherPartyName = isParticipant ? meeting.organizer_name : meeting.participant_name;

            return (
              <div
                key={meeting.id}
                className="p-4 border border-gray-100 rounded-xl hover:shadow-sm transition-all bg-gray-50/50"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider mb-2 ${
                        meeting.status === 'accepted'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : meeting.status === 'rejected'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {meeting.status}
                    </span>
                    <h4 className="text-sm font-bold text-gray-900">{meeting.title}</h4>
                    <p className="text-xs text-gray-600 mt-0.5">
                      With: <span className="font-medium text-gray-800">{otherPartyName}</span>
                    </p>
                  </div>

                  <div className="text-left sm:text-right flex flex-col sm:items-end justify-between min-w-[120px]">
                    <div className="text-xs text-gray-500 font-medium">
                      📅 {new Date(meeting.start_time).toLocaleDateString()} <br />
                      🕒 {new Date(meeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    <div className="flex flex-col gap-1.5 mt-3 w-full">
                      {meeting.status === 'accepted' && (
                        <button
                          onClick={() => onJoinCall(meeting.id.toString())}
                          className="w-full py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                        >
                          Join Video Call
                        </button>
                      )}

                      {meeting.status === 'pending' && isParticipant && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleAccept(meeting.id)}
                            className="flex-1 text-center py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleReject(meeting.id)}
                            className="flex-1 text-center py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300 transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};