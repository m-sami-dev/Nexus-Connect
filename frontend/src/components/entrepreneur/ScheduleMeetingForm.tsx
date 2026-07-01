import React, { useState } from 'react';
import { saveMeetingRequest } from '../../data/meetings';
import { useAuth } from '../../context/AuthContext';

interface ScheduleMeetingFormProps {
  participantId: number;
  participantName: string;
  onSuccess: () => void;
}

export const ScheduleMeetingForm: React.FC<ScheduleMeetingFormProps> = ({
  participantId,
  participantName,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      // Saving to our mock backend layer
      saveMeetingRequest({
        senderId: Number(user.id),
        receiverId: participantId,
        participantName: participantName,
        title,
        date,
        time,
        description,
      });

      alert('Meeting scheduled successfully!');
      onSuccess();
    } catch (error) {
      console.error(error);
      alert('Failed to schedule meeting.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-900">Schedule Meeting</h3>
        <p className="text-sm text-gray-500">With Investor: <span className="font-semibold text-gray-700">{participantName}</span></p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Meeting Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Pitch Deck Review"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Time</label>
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Description / Agenda</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Briefly describe the goal of this meeting..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onSuccess}
          className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-400"
        >
          {loading ? 'Scheduling...' : 'Send Request'}
        </button>
      </div>
    </form>
  );
};