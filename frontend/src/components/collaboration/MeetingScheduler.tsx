import React, { useState } from 'react';
import { X } from 'lucide-react';

interface SchedulerProps {
  onClose: () => void;
  entrepreneurId: string;
}

export const MeetingScheduler: React.FC<SchedulerProps> = ({ onClose, entrepreneurId }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const handleSchedule = () => {
    // Yahan hum API call ya global state update karenge
    console.log("Meeting saved for:", entrepreneurId, selectedDate, selectedTime);
    alert("Meeting Request Sent Successfully!");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-900">Request Meeting</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <input 
            type="date" 
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <select 
            className="w-full p-3 border border-gray-200 rounded-xl outline-none"
            onChange={(e) => setSelectedTime(e.target.value)}
          >
            <option value="">Select Time Slot</option>
            <option value="09:00 AM">09:00 AM</option>
            <option value="11:00 AM">11:00 AM</option>
            <option value="02:00 PM">02:00 PM</option>
          </select>
        </div>

        <button 
          onClick={handleSchedule}
          className="w-full mt-6 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all"
        >
          Send Request
        </button>
      </div>
    </div>
  );
};