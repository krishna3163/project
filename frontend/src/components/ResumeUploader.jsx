import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

const ResumeUploader = () => {
  const [uploading, setUploading] = useState(false);
  const [analysisId, setAnalysisId] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, processing, completed

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 5 * 1024 * 1024,
    onDrop: handleUpload
  });

  async function handleUpload(files) {
    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    setStatus('uploading');
    setUploading(true);
    
    try {
      const response = await axios.post('/api/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'userId': 'current-user-id' } // Note: replace current-user-id
      });
      
      setAnalysisId(response.data.resumeId);
      setStatus('processing');
      
      // Poll for results every 3 seconds
      pollAnalysisResults(response.data.resumeId);
      
    } catch (error) {
      console.error('Upload failed:', error);
      setStatus('failed');
    }
  }
  
  const pollAnalysisResults = async (resumeId) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`/api/resume/result/${resumeId}`, {
          headers: { 'userId': 'current-user-id' }
        });
        
        if(response.data.status === 'completed') {
          setAnalysisResult(response.data);
          setStatus('completed');
          clearInterval(interval);
        } else if(response.data.status === 'failed') {
          setStatus('failed');
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Upload Area */}
      {status === 'idle' && (
        <div {...getRootProps()} className="border-2 border-dashed border-gray-600 rounded-xl p-12 text-center cursor-pointer hover:border-indigo-500 transition">
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-white text-lg">Drag & drop your resume (PDF)</p>
          <p className="text-gray-400 text-sm mt-2">Max size: 5MB</p>
        </div>
      )}
      
      {/* Uploading State */}
      {status === 'uploading' && (
        <div className="bg-gray-800 rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-white">Uploading resume...</p>
        </div>
      )}
      
      {/* Processing State */}
      {status === 'processing' && (
        <div className="bg-gray-800 rounded-xl p-8 text-center">
          <div className="relative">
            <div className="animate-pulse">
              <FileText className="h-16 w-16 text-indigo-500 mx-auto mb-4" />
            </div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-indigo-400"></div>
            </div>
          </div>
          <p className="text-white text-lg mt-4">Analyzing your resume...</p>
          <p className="text-gray-400 text-sm">This may take 10-15 seconds</p>
        </div>
      )}
      
      {/* Results Display */}
      {status === 'completed' && analysisResult && (
        <div className="space-y-6">
          {/* Score Card */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold">Resume Analysis Complete!</h2>
                <p className="text-indigo-200 mt-1">ATS Score: {analysisResult.atsScore}/100</p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold">{analysisResult.analysisScore}%</div>
                <p className="text-indigo-200">Match Rate</p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-6 bg-white/20 rounded-full h-3">
              <div className="bg-white rounded-full h-3 transition-all duration-1000"
                   style={{ width: `${analysisResult.analysisScore}%` }} />
            </div>
          </div>
          
          {/* Keyword Matches */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-white font-bold text-lg mb-4">Keyword Analysis</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(analysisResult.keywordMatches).map(([keyword, data]) => (
                <div key={keyword} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <span className="text-gray-300">{keyword}</span>
                  {data.found ? (
                    <CheckCircle className="text-green-400" size={18} />
                  ) : (
                    <AlertCircle className="text-red-400" size={18} />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Suggestions */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-white font-bold text-lg mb-4">💡 Suggestions to Improve</h3>
            <ul className="space-y-3">
              {analysisResult.suggestions.map((suggestion, idx) => (
                <li key={idx} className="flex items-start gap-3 text-gray-300">
                  <span className="text-indigo-400 mt-1">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Formatting Issues */}
          {analysisResult.formattingIssues.length > 0 && (
            <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-6">
              <h3 className="text-yellow-400 font-bold mb-3">⚠️ Formatting Issues</h3>
              <ul className="space-y-2">
                {analysisResult.formattingIssues.map((issue, idx) => (
                  <li key={idx} className="text-yellow-300">{issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResumeUploader;
