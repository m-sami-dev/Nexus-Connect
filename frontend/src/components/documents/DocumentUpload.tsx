import React, { useState, useRef } from 'react';
import { Upload, Check, AlertCircle, Eye, PenTool, X } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';
import { PDFViewer } from './PDFViewer';
import { SignaturePad } from './SignaturePad';

interface UploadStatus {
  status: 'idle' | 'uploading' | 'success' | 'error';
  message?: string;
  progress?: number;
}

export const DocumentUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({ status: 'idle' });
  const [documents, setDocuments] = useState<any[]>([]);
  const [viewingDoc, setViewingDoc] = useState<any | null>(null);
  const [signingDoc, setSigningDoc] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/png',
    'image/jpeg',
  ];

  const MAX_SIZE = 50 * 1024 * 1024; // 50MB

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setUploadStatus({
        status: 'error',
        message: 'File type not allowed. Allowed: PDF, DOC, DOCX, XLS, XLSX, TXT, PNG, JPG',
      });
      return;
    }

    if (selectedFile.size > MAX_SIZE) {
      setUploadStatus({
        status: 'error',
        message: `File size exceeds 50MB limit. Your file: ${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`,
      });
      return;
    }

    setFile(selectedFile);
    setUploadStatus({ status: 'idle' });
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      setUploadStatus({
        status: 'error',
        message: 'Please enter a title and select a file',
      });
      return;
    }

    try {
      setUploadStatus({ status: 'uploading', progress: 0 });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('status', 'pending');

      const token = localStorage.getItem('access_token');

      const response = await fetch(`${API_BASE_URL}/documents/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      setUploadStatus({
        status: 'success',
        message: 'Document uploaded successfully!',
      });

      setFile(null);
      setTitle('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      fetchDocuments();
    } catch (error) {
      setUploadStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Upload failed',
      });
    }
  };

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('access_token');

      const response = await fetch(`${API_BASE_URL}/documents/my_documents/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      // Backend uses DRF pagination, so the real list is inside `results`
      setDocuments(data.results ?? data.documents ?? []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  React.useEffect(() => {
    fetchDocuments();
  }, []);

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      signed: 'bg-green-100 text-green-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const isPdf = (doc: any) => doc.file?.toLowerCase().endsWith('.pdf');

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Upload size={28} />
          Upload Document
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              aria-label="Select file to upload"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg"
            />
            <p className="text-xs text-gray-500 mt-1">
              Max size: 50MB. Allowed: PDF, DOC, DOCX, XLS, XLSX, TXT, PNG, JPG
            </p>
          </div>

          {file && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm">
                <span className="font-semibold">Selected:</span> {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
              </p>
            </div>
          )}

          {uploadStatus.status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{uploadStatus.message}</p>
            </div>
          )}

          {uploadStatus.status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
              <Check size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">{uploadStatus.message}</p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || !title.trim() || uploadStatus.status === 'uploading'}
            className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {uploadStatus.status === 'uploading' ? 'Uploading...' : 'Upload Document'}
          </button>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">My Documents ({documents.length})</h2>

        {documents.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No documents uploaded yet</p>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{doc.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusBadge(doc.status)}`}>
                    {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                  </span>
                </div>

                {doc.signature && (
                  <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                    <p className="text-xs text-green-700 font-semibold">✓ Digitally Signed</p>
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  {isPdf(doc) && (
                    <button
                      onClick={() => setViewingDoc(doc)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Eye size={14} />
                      View
                    </button>
                  )}

                  {doc.status !== 'signed' && (
                    <button
                      onClick={() => setSigningDoc(doc)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <PenTool size={14} />
                      Sign
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PDF Preview Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl">
            <button
              onClick={() => setViewingDoc(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
              aria-label="Close preview"
            >
              <X size={24} />
            </button>
            <PDFViewer documentUrl={viewingDoc.file} fileName={viewingDoc.title} />
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {signingDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl">
            <button
              onClick={() => setSigningDoc(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
              aria-label="Close signature pad"
            >
              <X size={24} />
            </button>
            <SignaturePad
              documentId={signingDoc.id}
              onSignatureSaved={() => {
                setSigningDoc(null);
                fetchDocuments();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;