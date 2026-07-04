import React, { useRef, useState, useEffect } from 'react';
import { Save, RotateCcw, Download } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';

interface SignaturePadProps {
  documentId: number;
  onSignatureSaved?: () => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ documentId, onSignatureSaved }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message?: string;
  }>({ type: 'idle' });

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Set white background
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Set drawing style
    context.strokeStyle = '#000';
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.lineJoin = 'round';
  }, []);

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.beginPath();
    context.moveTo(x, y);
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.lineTo(x, y);
    context.stroke();
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.beginPath();
    context.moveTo(x, y);
    setIsDrawing(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.lineTo(x, y);
    context.stroke();
  };

  const handleTouchEnd = () => {
    setIsDrawing(false);
  };

  // Clear canvas
  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    setSaveStatus({ type: 'idle' });
  };

  // Save signature
  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setIsSaving(true);

      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setSaveStatus({ type: 'error', message: 'Failed to create signature image' });
          return;
        }

        // Create FormData
        const formData = new FormData();
        formData.append('signature', blob, 'signature.png');

        const token = localStorage.getItem('access_token');

        // Upload to backend
        const response = await fetch(`${API_BASE_URL}/documents/${documentId}/add_signature/`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to save signature');
        }

        setSaveStatus({
          type: 'success',
          message: 'Signature saved successfully!',
        });

        // Clear canvas after successful save
        handleClear();

        // Call callback
        if (onSignatureSaved) {
          onSignatureSaved();
        }
      }, 'image/png');
    } catch (error) {
      setSaveStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to save signature',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Download signature
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `signature-${documentId}.png`;
    link.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">Draw Your Signature</h3>

        {/* Canvas */}
        <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="w-full h-64 cursor-crosshair bg-white touch-none"
          />
        </div>

        {/* Instructions */}
        <p className="text-sm text-gray-600 mt-2">
          Draw your signature above. Use mouse or touch to sign.
        </p>

        {/* Status Messages */}
        {saveStatus.type === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
            <p className="text-sm text-green-700 font-medium">✓ {saveStatus.message}</p>
          </div>
        )}

        {saveStatus.type === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
            <p className="text-sm text-red-700 font-medium">✗ {saveStatus.message}</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
          >
            <RotateCcw size={18} />
            Clear
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
          >
            <Download size={18} />
            Preview
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors ml-auto"
          >
            <Save size={18} />
            {isSaving ? 'Saving...' : 'Save Signature'}
          </button>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
        <p className="font-semibold mb-2">💡 Tips:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Sign naturally as you would on paper</li>
          <li>Use the full canvas area for better recognition</li>
          <li>Keep your signature consistent</li>
          <li>Clear and try again if needed</li>
        </ul>
      </div>
    </div>
  );
};

export default SignaturePad;
