"""
Enhanced WebRTC Consumer with full SDP offer/answer and ICE candidate handling
Complete video call signaling implementation
"""
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)
User = get_user_model()


class VideoCallConsumer(AsyncWebsocketConsumer):
    """
    WebRTC signaling consumer for video calls
    Handles SDP offer/answer exchange and ICE candidates
    """
    
    # Store active connections: {room_name: {user_id: consumer}}
    rooms = {}
    
    async def connect(self):
        """
        Handle WebSocket connection
        Extract room name and user info from connection
        """
        try:
            self.room_name = self.scope['url_route']['kwargs']['room_name']
            self.room_group_name = f'video_{self.room_name}'
            self.user = self.scope.get('user')
            self.user_id = self.user.id if self.user and self.user.is_authenticated else None
            
            if not self.user_id:
                logger.warning(f"Unauthenticated connection attempt to room {self.room_name}")
                await self.close()
                return
            
            logger.info(f"User {self.user_id} connecting to video room {self.room_name}")
            
            # Join room group
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)
            await self.accept()
            
            # Notify others that user joined
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_joined',
                    'user_id': self.user_id,
                    'username': self.user.username,
                    'message': f'{self.user.username} joined the call'
                }
            )
            
            logger.info(f"User {self.user_id} connected to room {self.room_name}")
            
        except Exception as e:
            logger.error(f"Connection error: {str(e)}", exc_info=True)
            await self.close()

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        try:
            logger.info(f"User {self.user_id} disconnecting from room {self.room_name}")
            
            # Leave room group
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
            
            # Notify others that user left
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_left',
                    'user_id': self.user_id,
                    'message': f'{self.user.username} left the call'
                }
            )
        except Exception as e:
            logger.error(f"Disconnect error: {str(e)}", exc_info=True)

    async def receive(self, text_data):
        """
        Receive message from WebSocket
        Handle SDP offer/answer, ICE candidates, and other signaling
        """
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            logger.debug(f"Received {message_type} from user {self.user_id}")
            
            # Route based on message type
            if message_type == 'offer':
                await self.handle_offer(data)
            elif message_type == 'answer':
                await self.handle_answer(data)
            elif message_type == 'ice_candidate':
                await self.handle_ice_candidate(data)
            elif message_type == 'call_request':
                await self.handle_call_request(data)
            elif message_type == 'call_response':
                await self.handle_call_response(data)
            elif message_type == 'call_end':
                await self.handle_call_end(data)
            else:
                logger.warning(f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            logger.error("Invalid JSON received")
            await self.send_error("Invalid JSON format")
        except Exception as e:
            logger.error(f"Receive error: {str(e)}", exc_info=True)
            await self.send_error(f"Error processing message: {str(e)}")

    async def handle_offer(self, data):
        """
        Handle SDP offer from caller
        Broadcast to recipient
        """
        try:
            target_user_id = data.get('target_user_id')
            sdp = data.get('sdp')
            
            if not sdp or not target_user_id:
                await self.send_error("Missing SDP or target user ID")
                return
            
            logger.info(f"User {self.user_id} sending offer to {target_user_id}")
            
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'receive_offer',
                    'from_user_id': self.user_id,
                    'from_username': self.user.username,
                    'target_user_id': target_user_id,
                    'sdp': sdp
                }
            )
        except Exception as e:
            logger.error(f"Offer handling error: {str(e)}")
            await self.send_error(str(e))

    async def handle_answer(self, data):
        """
        Handle SDP answer from callee
        Send back to caller
        """
        try:
            target_user_id = data.get('target_user_id')
            sdp = data.get('sdp')
            
            if not sdp or not target_user_id:
                await self.send_error("Missing SDP or target user ID")
                return
            
            logger.info(f"User {self.user_id} sending answer to {target_user_id}")
            
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'receive_answer',
                    'from_user_id': self.user_id,
                    'from_username': self.user.username,
                    'target_user_id': target_user_id,
                    'sdp': sdp
                }
            )
        except Exception as e:
            logger.error(f"Answer handling error: {str(e)}")
            await self.send_error(str(e))

    async def handle_ice_candidate(self, data):
        """
        Handle ICE candidate exchange
        Relay to target user
        """
        try:
            target_user_id = data.get('target_user_id')
            candidate = data.get('candidate')
            
            if not candidate or not target_user_id:
                await self.send_error("Missing ICE candidate or target user ID")
                return
            
            logger.debug(f"User {self.user_id} sending ICE candidate to {target_user_id}")
            
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'receive_ice_candidate',
                    'from_user_id': self.user_id,
                    'target_user_id': target_user_id,
                    'candidate': candidate
                }
            )
        except Exception as e:
            logger.error(f"ICE candidate handling error: {str(e)}")
            await self.send_error(str(e))

    async def handle_call_request(self, data):
        """
        Handle incoming call request
        Notify recipient
        """
        try:
            target_user_id = data.get('target_user_id')
            
            if not target_user_id:
                await self.send_error("Missing target user ID")
                return
            
            logger.info(f"User {self.user_id} calling user {target_user_id}")
            
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'incoming_call',
                    'from_user_id': self.user_id,
                    'from_username': self.user.username,
                    'target_user_id': target_user_id,
                    'room_name': self.room_name
                }
            )
        except Exception as e:
            logger.error(f"Call request handling error: {str(e)}")
            await self.send_error(str(e))

    async def handle_call_response(self, data):
        """
        Handle call response (accept/reject)
        """
        try:
            target_user_id = data.get('target_user_id')
            accepted = data.get('accepted', False)
            
            if not target_user_id:
                await self.send_error("Missing target user ID")
                return
            
            response_status = "accepted" if accepted else "rejected"
            logger.info(f"User {self.user_id} {response_status} call from {target_user_id}")
            
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'call_response_received',
                    'from_user_id': self.user_id,
                    'from_username': self.user.username,
                    'target_user_id': target_user_id,
                    'accepted': accepted
                }
            )
        except Exception as e:
            logger.error(f"Call response handling error: {str(e)}")
            await self.send_error(str(e))

    async def handle_call_end(self, data):
        """
        Handle call termination
        """
        try:
            target_user_id = data.get('target_user_id')
            
            logger.info(f"User {self.user_id} ending call with {target_user_id}")
            
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'call_ended',
                    'from_user_id': self.user_id,
                    'from_username': self.user.username,
                    'target_user_id': target_user_id
                }
            )
        except Exception as e:
            logger.error(f"Call end handling error: {str(e)}")
            await self.send_error(str(e))

    # ============ Broadcast handlers ============

    async def receive_offer(self, event):
        """Broadcast SDP offer to recipient"""
        if event['target_user_id'] == self.user_id:
            await self.send(text_data=json.dumps({
                'type': 'offer',
                'from_user_id': event['from_user_id'],
                'from_username': event['from_username'],
                'sdp': event['sdp']
            }))

    async def receive_answer(self, event):
        """Broadcast SDP answer to caller"""
        if event['target_user_id'] == self.user_id:
            await self.send(text_data=json.dumps({
                'type': 'answer',
                'from_user_id': event['from_user_id'],
                'from_username': event['from_username'],
                'sdp': event['sdp']
            }))

    async def receive_ice_candidate(self, event):
        """Broadcast ICE candidate to target user"""
        if event['target_user_id'] == self.user_id:
            await self.send(text_data=json.dumps({
                'type': 'ice_candidate',
                'from_user_id': event['from_user_id'],
                'candidate': event['candidate']
            }))

    async def user_joined(self, event):
        """Notify all users that someone joined"""
        await self.send(text_data=json.dumps({
            'type': 'user_joined',
            'user_id': event['user_id'],
            'username': event['username'],
            'message': event['message']
        }))

    async def user_left(self, event):
        """Notify all users that someone left"""
        await self.send(text_data=json.dumps({
            'type': 'user_left',
            'user_id': event['user_id'],
            'message': event['message']
        }))

    async def incoming_call(self, event):
        """Notify target user of incoming call"""
        if event['target_user_id'] == self.user_id:
            await self.send(text_data=json.dumps({
                'type': 'incoming_call',
                'from_user_id': event['from_user_id'],
                'from_username': event['from_username'],
                'room_name': event['room_name']
            }))

    async def call_response_received(self, event):
        """Notify caller of call response"""
        if event['target_user_id'] == self.user_id:
            await self.send(text_data=json.dumps({
                'type': 'call_response',
                'from_user_id': event['from_user_id'],
                'from_username': event['from_username'],
                'accepted': event['accepted']
            }))

    async def call_ended(self, event):
        """Notify participants that call ended"""
        if event['target_user_id'] == self.user_id or self.user_id == event['from_user_id']:
            await self.send(text_data=json.dumps({
                'type': 'call_ended',
                'from_user_id': event['from_user_id'],
                'from_username': event['from_username']
            }))

    async def send_error(self, message):
        """Send error message to client"""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': message
        }))
