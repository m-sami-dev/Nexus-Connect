import React from 'react';
import { ExternalLink, Building2 } from 'lucide-react';
import { Card, CardBody, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface Pitch {
  id: number;
  title: string;
  description: string;
  funding_goal: string | number;
  industry: string;
  entrepreneur_name: string;
  pitch_deck: string | null;
  created_at: string;
}

interface PitchCardProps {
  pitch: Pitch;
  connectionStatus?: 'pending' | 'accepted' | 'rejected' | null;
  onConnect?: (pitchId: number) => void;
  connecting?: boolean;
}

export const PitchCard: React.FC<PitchCardProps> = ({
  pitch,
  connectionStatus,
  onConnect,
  connecting = false,
}) => {
  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'pending':
        return <Badge variant="warning">Request Pending</Badge>;
      case 'accepted':
        return <Badge variant="success">Connected</Badge>;
      case 'rejected':
        return <Badge variant="error">Declined</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card hoverable className="transition-all duration-300 h-full">
      <CardBody className="flex flex-col">
        <div className="flex items-start justify-between">
          <div className="flex items-start">
            <div className="p-3 bg-primary-50 rounded-full mr-3">
              <Building2 size={20} className="text-primary-700" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{pitch.title}</h3>
              <p className="text-sm text-gray-500">by {pitch.entrepreneur_name}</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="primary" size="sm">{pitch.industry}</Badge>
        </div>

        <p className="text-sm text-gray-600 mt-3 line-clamp-3">{pitch.description}</p>

        <div className="mt-3">
          <span className="text-xs text-gray-500">Funding Goal</span>
          <p className="text-sm font-medium text-gray-900">
            ${Number(pitch.funding_goal).toLocaleString()}
          </p>
        </div>
      </CardBody>

      <CardFooter className="border-t border-gray-100 bg-gray-50 flex justify-between">
        {pitch.pitch_deck ? (
          <a href={pitch.pitch_deck} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" rightIcon={<ExternalLink size={16} />}>
              View Deck
            </Button>
          </a>
        ) : (
          <span className="text-xs text-gray-400">No deck uploaded</span>
        )}

        {onConnect && !connectionStatus && (
          <Button
            variant="primary"
            size="sm"
            disabled={connecting}
            onClick={() => onConnect(pitch.id)}
          >
            {connecting ? 'Sending...' : 'Connect'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};