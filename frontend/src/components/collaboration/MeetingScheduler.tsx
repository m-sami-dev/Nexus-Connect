import React, { useState } from 'react';
import axios from 'axios';

export const MeetingScheduler = () => {
  const [formData, setFormData] = useState({
    title: '',
    participant: '',
    start_time: '',
    end_time: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
    try {
      const token = localStorage.getItem('token'); // Ya jo bhi auth method tum use kar rahe ho
      await axios.post('http://127.0.0.1:8000/api/auth/meetings/', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Meeting Successfully Scheduled!");
    } catch (error: any) {
      alert(error.response?.data?.detail || "Conflict: Is waqt pehle se meeting hai!");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
  type="text" 
  placeholder="Title" 
  aria-label="Title" // Yeh line add karo
  onChange={(e) => setFormData({...formData, title: e.target.value})} 
/>

<input 
  type="number" 
  placeholder="Participant ID" 
  aria-label="Participant ID" // Yeh line add karo
  onChange={(e) => setFormData({...formData, participant: e.target.value})} 
/>

<input 
  type="datetime-local" 
  aria-label="Start Time" // Yeh line add karo
  onChange={(e) => setFormData({...formData, start_time: e.target.value})} 
/>

<input 
  type="datetime-local" 
  aria-label="End Time" // Yeh line add karo
  onChange={(e) => setFormData({...formData, end_time: e.target.value})} 
/>
      <button type="submit">Schedule Meeting</button>
    </form>
  );
};