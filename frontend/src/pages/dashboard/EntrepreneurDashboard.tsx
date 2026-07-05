import React, { useState, useEffect } from 'react';
import { PlusCircle, Check, X, Building2 } from 'lucide-react';
import { CreatePitchForm } from '../../components/entrepreneur/CreatePitchForm';
import { ScheduleMeetingForm } from '../../components/entrepreneur/ScheduleMeetingForm';
import { MeetingsList } from '../../components/collaboration/MeetingsList';
import { VideoCall } from '../../components/collaboration/VideoCall';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { fetchPitches } from '../../services/pitchService';
import {
  fetchConnections,
  acceptConnection,
  rejectConnection,
} from '../../services/connectionService';

export const EntrepreneurDashboard = () => {
  const { user } = useAuth();
  const [isPitchModalOpen, setIsPitchModalOpen] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState<{ id: number; name: string } | null>(null);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);

  const [myPitches, setMyPitches] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [allPitches, connections] = await Promise.all([
        fetchPitches(),
        fetchConnections(),
      ]);
      setMyPitches(allPitches.filter((p: any) => String(p.entrepreneur) === String(user?.id)));
      setIncomingRequests(connections);
      setActionError('');
    } catch (err) {
      setActionError('Failed to load your pitches and requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) return null;

  const token = localStorage.getItem('access_token') || '';

  const handleAccept = async (id: number) => {
    try {
      await acceptConnection(id);
      setIncomingRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'accepted' } : r))
      );
    } catch (err) {
      setActionError('Failed to accept request.');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await rejectConnection(id);
      setIncomingRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r))
      );
    } catch (err) {
      setActionError('Failed to reject request.');
    }
  };

  const closeMeetingModal = () => {
    setIsMeetingModalOpen(false);
    setSelectedInvestor(null);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Dashboard</h1>
          <p className="text-gray-600">Manage your pitches and investor connections</p>
        </div>
        <Button leftIcon={<PlusCircle size={18} />} onClick={() => setIsPitchModalOpen(true)}>
          Submit New Pitch
        </Button>
      </div>

      {actionError && (
        <div className="p-4 rounded-md bg-red-100 text-red-800 border border-red-200 text-sm">
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Incoming connection requests from investors */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Investor Connection Requests</h2>
            </CardHeader>
            <CardBody>
              {loading ? (
                <p className="text-gray-600 text-center py-4">Loading...</p>
              ) : incomingRequests.length === 0 ? (
                <p className="text-gray-600 text-center py-4">No connection requests yet.</p>
              ) : (
                <div className="space-y-3">
                  {incomingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between border border-gray-100 rounded-lg p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {req.investor_name} wants to connect
                        </p>
                        <p className="text-xs text-gray-500">Pitch: {req.pitch_title}</p>
                      </div>

                      {req.status === 'pending' ? (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<X size={16} />}
                            onClick={() => handleReject(req.id)}
                          >
                            Reject
                          </Button>
                          <Button
                            variant="success"
                            size="sm"
                            leftIcon={<Check size={16} />}
                            onClick={() => handleAccept(req.id)}
                          >
                            Accept
                          </Button>
                        </div>
                      ) : req.status === 'accepted' ? (
                        <Badge variant="success">Accepted</Badge>
                      ) : (
                        <Badge variant="error">Rejected</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* My submitted pitches */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">My Pitches</h2>
            </CardHeader>
            <CardBody>
              {loading ? (
                <p className="text-gray-600 text-center py-4">Loading...</p>
              ) : myPitches.length === 0 ? (
                <p className="text-gray-600 text-center py-4">
                  You haven't submitted a pitch yet. Click "Submit New Pitch" to get started.
                </p>
              ) : (
                <div className="space-y-3">
                  {myPitches.map((pitch) => (
                    <div
                      key={pitch.id}
                      className="flex items-center justify-between border border-gray-100 rounded-lg p-3"
                    >
                      <div className="flex items-center">
                        <Building2 size={18} className="text-primary-600 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{pitch.title}</p>
                          <p className="text-xs text-gray-500">{pitch.industry}</p>
                        </div>
                      </div>
                      <Badge variant="gray">
                        ${Number(pitch.funding_goal).toLocaleString()}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <MeetingsList onJoinCall={(roomId) => setActiveRoom(roomId)} />
        </div>
      </div>

      {/* Video Call Overlay */}
      {activeRoom && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4">
          <button
            onClick={() => setActiveRoom(null)}
            className="absolute top-4 right-4 text-white text-lg"
          >
            Close Call
          </button>
          <VideoCall roomName={activeRoom} />
        </div>
      )}

      {/* Meeting Scheduling Modal */}
      {isMeetingModalOpen && selectedInvestor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <ScheduleMeetingForm
            participantId={selectedInvestor.id}
            participantName={selectedInvestor.name}
            onSuccess={closeMeetingModal}
          />
        </div>
      )}

      {/* Create Pitch Modal */}
      {isPitchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setIsPitchModalOpen(false)}
              aria-label="Close"
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            <CreatePitchForm
              token={token}
              onSuccess={() => {
                setIsPitchModalOpen(false);
                loadData();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};