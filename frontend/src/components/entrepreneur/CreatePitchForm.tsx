import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { createPitch } from '../../services/pitchService';

interface CreatePitchFormProps {
  token: string;
  onSuccess: () => void;
}

export const CreatePitchForm: React.FC<CreatePitchFormProps> = ({ token, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fundingGoal, setFundingGoal] = useState('');
  const [industry, setIndustry] = useState('');
  const [pitchDeck, setPitchDeck] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPitchDeck(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsSuccess(false);

    const pitchData = {
      title,
      description,
      funding_goal: fundingGoal,
      industry,
      pitch_deck: pitchDeck,
    };

    try {
      await createPitch(pitchData, token);
      setMessage('Pitch created successfully! ');
      setIsSuccess(true);
      
      // Clear all form inputs
      setTitle('');
      setDescription('');
      setFundingGoal('');
      setIndustry('');
      setPitchDeck(null);

      // Wait for 3 seconds to let the user see the success notification before closing
      setTimeout(() => {
        onSuccess();
      }, 3000);

    } catch (error) {
      setMessage('Failed to create pitch. Please check your data and connection.');
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto my-4 border-0 shadow-none">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Submit Your Startup Pitch</h2>
      
      {message && (
        <div className={`p-4 mb-4 rounded-md text-sm font-medium ${isSuccess ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
          {message}
        </div>
      )}

      {/* Hide the form fields if the submission is successful to keep the UI clean */}
      {!isSuccess && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Nexus Collaboration Platform"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full min-h-[100px] rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your vision, target market, and product..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Funding Goal ($)</label>
              <Input
                type="number"
                value={fundingGoal}
                onChange={(e) => setFundingGoal(e.target.value)}
                placeholder="e.g., 50000"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <Input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g., FinTech, SaaS"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pitch Deck (PDF/Document)</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>

          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? 'Submitting Pitch...' : 'Create Pitch'}
          </Button>
        </form>
      )}
    </Card>
  );
};