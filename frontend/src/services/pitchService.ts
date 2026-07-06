import axios from 'axios';
import API from './api';

const API_URL = `${import.meta.env.VITE_API_URL}auth/pitches/`;

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

/**
 * Fetches all startup pitches for the Investor Feed.
 * Every registered investor sees every pitch by default (no permission layer).
 */
export const fetchPitches = async () => {
  const response = await API.get('auth/pitches/');
  // Backend uses pagination, so the real list is inside `results`
  return response.data.results ?? response.data;
};