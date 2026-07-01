import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ExternalLink, Calendar } from 'lucide-react';
import { Entrepreneur } from '../../types';
import { Card, CardBody, CardFooter } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { MeetingScheduler } from '../collaboration/MeetingScheduler';

interface EntrepreneurCardProps {
  entrepreneur: Entrepreneur;
  showActions?: boolean;
}

export const EntrepreneurCard: React.FC<EntrepreneurCardProps> = ({
  entrepreneur,
  showActions = true
}) => {
  const navigate = useNavigate();
  const [showScheduler, setShowScheduler] = useState(false);
  
  const handleViewProfile = () => {
    navigate(`/profile/entrepreneur/${entrepreneur.id}`);
  };
  
  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/chat/${entrepreneur.id}`);
  };

  const handleRequestMeeting = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowScheduler(true);
  };
  
  return (
    <>
      <Card 
        hoverable 
        className="transition-all duration-300 h-full"
        onClick={handleViewProfile}
      >
        <CardBody className="flex flex-col">
          <div className="flex items-start">
            <Avatar
              src={entrepreneur.avatarUrl}
              alt={entrepreneur.name}
              size="lg"
              status={entrepreneur.isOnline ? 'online' : 'offline'}
              className="mr-4"
            />
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{entrepreneur.name}</h3>
              <p className="text-sm text-gray-500 mb-2">{entrepreneur.startupName}</p>
              
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="primary" size="sm">{entrepreneur.industry}</Badge>
                <Badge variant="gray" size="sm">{entrepreneur.location}</Badge>
              </div>
            </div>
          </div>
          
          <div className="mt-3">
            <h4 className="text-sm font-medium text-gray-900 mb-1">Pitch Summary</h4>
            <p className="text-sm text-gray-600 line-clamp-3">{entrepreneur.pitchSummary}</p>
          </div>
          
          <div className="mt-3 flex justify-between items-center">
            <div>
              <span className="text-xs text-gray-500">Funding Need</span>
              <p className="text-sm font-medium text-gray-900">{entrepreneur.fundingNeeded}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Team Size</span>
              <p className="text-sm font-medium text-gray-900">{entrepreneur.teamSize} people</p>
            </div>
          </div>
        </CardBody>
        
        {showActions && (
          <CardFooter className="border-t border-gray-100 bg-gray-50 flex flex-col gap-2">
            <div className="flex justify-between w-full">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<MessageCircle size={16} />}
                onClick={handleMessage}
              >
                Message
              </Button>
              <Button
                variant="primary"
                size="sm"
                rightIcon={<ExternalLink size={16} />}
                onClick={handleViewProfile}
              >
                View
              </Button>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
              leftIcon={<Calendar size={16} />}
              onClick={handleRequestMeeting}
            >
              Request Meeting
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Scheduler Modal */}
      {showScheduler && (
        <MeetingScheduler 
          entrepreneurId={entrepreneur.id} 
          onClose={() => setShowScheduler(false)} 
        />
      )}
    </>
  );
};