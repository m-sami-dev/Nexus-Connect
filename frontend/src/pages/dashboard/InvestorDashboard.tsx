import React, { useState, useEffect } from 'react';
import { Users, PieChart, Search } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PitchCard } from '../../components/pitch/PitchCard';
import { useAuth } from '../../context/AuthContext';
import { fetchPitches } from '../../services/pitchService';
import { fetchConnections, sendConnectionRequest } from '../../services/connectionService';
import { MeetingsList } from '../../components/collaboration/MeetingsList';
import { VideoCall } from '../../components/collaboration/VideoCall';

export const InvestorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [pitches, setPitches] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingId, setConnectingId] = useState<number | null>(null);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [pitchData, connectionData] = await Promise.all([
        fetchPitches(),
        fetchConnections(),
      ]);
      setPitches(pitchData);
      setConnections(connectionData);
      setError('');
    } catch (err) {
      setError('Failed to load pitches. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!user) return null;

  const getConnectionStatus = (pitchId: number) => {
    const match = connections.find((c) => c.pitch === pitchId);
    return match ? match.status : null;
  };

  const handleConnect = async (pitchId: number) => {
    try {
      setConnectingId(pitchId);
      const newConnection = await sendConnectionRequest(pitchId);
      setConnections((prev) => [...prev, newConnection]);
    } catch (err) {
      setError('Failed to send connection request.');
    } finally {
      setConnectingId(null);
    }
  };

  const industries = Array.from(new Set(pitches.map((p) => p.industry)));

  const filteredPitches = pitches.filter((pitch) => {
    const matchesSearch =
      searchQuery === '' ||
      pitch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pitch.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pitch.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesIndustry =
      selectedIndustries.length === 0 || selectedIndustries.includes(pitch.industry);

    return matchesSearch && matchesIndustry;
  });

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(industry) ? prev.filter((i) => i !== industry) : [...prev, industry]
    );
  };

  const acceptedCount = connections.filter((c) => c.status === 'accepted').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Discover Startups</h1>
        <p className="text-gray-600">Find and connect with promising entrepreneurs</p>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-red-100 text-red-800 border border-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Filters and search */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="w-full md:w-2/3">
          <Input
            placeholder="Search startups, industries, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            startAdornment={<Search size={18} />}
          />
        </div>

        <div className="w-full md:w-1/3 flex items-center">
          <div className="flex flex-wrap gap-2">
            {industries.map((industry) => (
              <div
                key={industry}
                onClick={() => toggleIndustry(industry)}
                className="cursor-pointer inline-block"
              >
                <Badge variant={selectedIndustries.includes(industry) ? 'primary' : 'gray'}>
                  {industry}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary-50 border border-primary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-full mr-4">
                <Users size={20} className="text-primary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-700">Total Pitches</p>
                <h3 className="text-xl font-semibold text-primary-900">{pitches.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-secondary-50 border border-secondary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-full mr-4">
                <PieChart size={20} className="text-secondary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-700">Industries</p>
                <h3 className="text-xl font-semibold text-secondary-900">{industries.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-accent-50 border border-accent-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-accent-100 rounded-full mr-4">
                <Users size={20} className="text-accent-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-accent-700">Your Connections</p>
                <h3 className="text-xl font-semibold text-accent-900">{acceptedCount}</h3>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <MeetingsList onJoinCall={(roomId) => setActiveRoom(roomId)} />

      <div>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Investor Feed</h2>
          </CardHeader>

          <CardBody>
            {loading ? (
              <p className="text-center py-8 text-gray-600">Loading pitches...</p>
            ) : filteredPitches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPitches.map((pitch) => (
                  <PitchCard
                    key={pitch.id}
                    pitch={pitch}
                    connectionStatus={getConnectionStatus(pitch.id)}
                    onConnect={handleConnect}
                    connecting={connectingId === pitch.id}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No pitches match your filters</p>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedIndustries([]);
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
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
    </div>
  );
};