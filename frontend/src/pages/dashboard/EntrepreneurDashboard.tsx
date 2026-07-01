import React, { useState } from 'react';
import { investors } from "../../data/users";
import { CreatePitchForm } from '../../components/entrepreneur/CreatePitchForm';
// New Import for Meeting Form Layer
import { ScheduleMeetingForm } from '../../components/entrepreneur/ScheduleMeetingForm';
import { MeetingsList } from '../../components/collaboration/MeetingsList';
import { useAuth } from '../../context/AuthContext';

export const EntrepreneurDashboard = () => {
  const { user } = useAuth();
  const [isPitchModalOpen, setIsPitchModalOpen] = useState(false);
  
  // Meeting Modal State Layers
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState<{ id: number; name: string } | null>(null);

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
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name || 'samitest12'}</h1>
          <p className="text-gray-500 text-sm">Here's what's happening with your startup today</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsPitchModalOpen(true)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            + Create Pitch
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
            Find Investors
          </button>
        </div>
      </div>

      {/* Grid Stats Counters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">🔔</div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Pending Requests</p>
            <p className="text-xl font-bold text-gray-900">0</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">👥</div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Connections</p>
            <p className="text-xl font-bold text-gray-900">0</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">📅</div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Upcoming Meetings</p>
            <p className="text-xl font-bold text-gray-900">2</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">📈</div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Profile Views</p>
            <p className="text-xl font-bold text-gray-900">24</p>
          </div>
        </div>
      </div>

      {/* Main Content Splits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left/Middle Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Existing No Requests Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 min-h-[250px] flex flex-col items-center justify-center text-center">
            <div className="p-4 bg-gray-50 rounded-full text-gray-400 mb-3">⚠️</div>
            <h3 className="text-base font-semibold text-gray-900">No collaboration requests yet</h3>
            <p className="text-gray-500 text-sm max-w-sm mt-1">When investors are interested in your startup, their requests will appear here</p>
          </div>

          {/* Real-time Meetings Management Layer */}
          <MeetingsList />
        </div>

        {/* Right Sidebar: Investors Stack */}
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Recommended Investors</h3>
            <button className="text-xs font-semibold text-blue-600 hover:underline">View all</button>
          </div>
          
          <div className="space-y-4">
            {investors.slice(0, 3).map((investor) => (
              <div key={investor.id} className="p-4 border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 truncate">{investor.name}</h4>
                    <p className="text-xs text-gray-500 mb-2">Investor • {investor.industry || 'SaaS, FinTech'}</p>
                    
                    {/* Schedule Hook Action Trigger */}
                    <button 
                      onClick={() => openMeetingModal(Number(investor.id), investor.name)}
                      className="w-full text-center py-1.5 border border-blue-600 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-50 transition-colors mt-1"
                    >
                      Schedule Meet
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL ARCHITECTURE LAYERS */}
      
      {/* 1. Pitch Submission Modal */}
      {isPitchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full relative overflow-hidden">
            <button 
              onClick={() => setIsPitchModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold z-10"
            >
              &times;
            </button>
            <CreatePitchForm token={localStorage.getItem('access_token') || ''} onSuccess={() => setIsPitchModalOpen(false)} />
          </div>
        </div>
      )}

      {/* 2. Meeting Scheduling Modal */}
      {isMeetingModalOpen && selectedInvestor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full relative overflow-hidden">
            <button 
              onClick={closeMeetingModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold z-10"
            >
              &times;
            </button>
            <ScheduleMeetingForm 
              participantId={selectedInvestor.id} 
              participantName={selectedInvestor.name} 
              onSuccess={closeMeetingModal} 
            />
          </div>
        </div>
      )}
    </div>
  );
};