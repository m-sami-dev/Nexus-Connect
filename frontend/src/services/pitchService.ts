import axios from 'axios';

const API_URL = 'http://localhost:8000/api/auth/pitches/';

/**
 * Submits a new startup pitch to the backend.
 * Handles both text fields and file uploads using FormData.
 */
export const createPitch = async (pitchData: any, token: string) => {
  const formData = new FormData();
  
  // Append text fields to FormData
  formData.append('title', pitchData.title);
  formData.append('description', pitchData.description);
  formData.append('funding_goal', pitchData.funding_goal);
  formData.append('industry', pitchData.industry);
  
  // Append pitch deck file if it exists
  if (pitchData.pitch_deck) {
    formData.append('pitch_deck', pitchData.pitch_deck);
  }

  // Execute POST request with Authorization headers
  const response = await axios.post(API_URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${token}`,
    },
  });

  return response.data;
};