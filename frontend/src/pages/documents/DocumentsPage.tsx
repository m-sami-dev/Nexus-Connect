import React from 'react';
import { DocumentUpload } from '../../components/documents/DocumentUpload';

export const DocumentsPage: React.FC = () => {
  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Document Chamber</h1>
        <p className="text-gray-600">Upload, preview, and e-sign your documents</p>
      </div>
      <DocumentUpload />
    </div>
  );
};

export default DocumentsPage;