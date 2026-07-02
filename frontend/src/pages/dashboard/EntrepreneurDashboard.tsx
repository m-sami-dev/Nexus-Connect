import React, { useState } from 'react';
import { investors } from "../../data/users";
import { CreatePitchForm } from '../../components/entrepreneur/CreatePitchForm';
import { ScheduleMeetingForm } from '../../components/entrepreneur/ScheduleMeetingForm';
import { MeetingsList } from '../../components/collaboration/MeetingsList';
// New Import for Video Call
import { VideoCall } from '../../components/collaboration/VideoCall'; 
import { useAuth } from '../../context/AuthContext';

export const EntrepreneurDashboard = () => {
  const { user } = useAuth();
  const [isPitchModalOpen, setIsPitchModalOpen] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState<{ id: number; name: string } | null>(null);
  
  // Video Call State
  const [activeRoom, setActiveRoom] = useState<string | null>(null);

  if (!user) return null;

  const openMeetingModal = (investorId: number, investorName: string) => {
    setSelectedInvestor({ id: investorId, name: investorName });
    setIsMeetingModalOpen(true);
  };

  const closeMeetingModal = () => {
    setIsMeetingModalOpen(false);
    setSelectedInvestor(null);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      {/* ... (Header aur Stats waisay hi rahengy) ... */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Real-time Meetings Management Layer */}
          <MeetingsList onJoinCall={(roomId) => setActiveRoom(roomId)} />
        </div>

        {/* ... (Investors Stack waisay hi rahengy) ... */}
      </div>

      {/* MODAL ARCHITECTURE LAYERS */}
      
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
            {/* ... (Modal content same rahega) ... */}
            <ScheduleMeetingForm 
              participantId={selectedInvestor.id} 
              participantName={selectedInvestor.name} 
              onSuccess={closeMeetingModal} 
            />
        </div>
      )}
    </div>
  );
};