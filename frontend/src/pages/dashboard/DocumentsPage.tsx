import React, { useState } from 'react';
import { FileText, Upload, Trash2, ShieldCheck, Plus } from 'lucide-react';

export const DocumentsPage: React.FC = () => {
  const [files, setFiles] = useState([
    { id: '1', name: 'Pitch_Deck_Final.pdf', type: 'PDF', size: '2.4 MB', uploadedAt: '2026-06-25', sharedWith: ['Michael Rodriguez'] },
    { id: '2', name: 'Financial_Projections.xlsx', type: 'DOCX', size: '1.1 MB', uploadedAt: '2026-06-28', sharedWith: [] }
  ]);

  const handleFileUpload = () => {
    const newFile = {
      id: Date.now().toString(),
      name: `New_Document_${files.length + 1}.pdf`,
      type: 'PDF',
      size: '0.8 MB',
      uploadedAt: new Date().toISOString().split('T')[0],
      sharedWith: []
    };
    setFiles([newFile, ...files]);
  };

  const deleteFile = (id: string) => {
    setFiles(files.filter(file => file.id !== id));
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
          <p className="text-sm text-gray-500">Securely manage and share your startup documents</p>
        </div>
        <button 
          onClick={handleFileUpload}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Upload size={18} /> Upload File
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase font-semibold">
            <tr>
              <th className="p-4">File Name</th>
              <th className="p-4">Size</th>
              <th className="p-4">Uploaded</th>
              <th className="p-4">Shared With</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {files.map(file => (
              <tr key={file.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 flex items-center gap-3 font-medium text-gray-900">
                  <FileText className="text-blue-500" size={20} /> {file.name}
                </td>
                <td className="p-4 text-gray-500">{file.size}</td>
                <td className="p-4 text-gray-500">{file.uploadedAt}</td>
                <td className="p-4">
                  {file.sharedWith.length > 0 ? (
                    <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-medium w-fit">
                      <ShieldCheck size={12}/> {file.sharedWith[0]}
                    </span>
                  ) : <span className="text-gray-400 text-xs italic">Private</span>}
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => deleteFile(file.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};