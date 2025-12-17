'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button, Spinner } from '@/components/ui';

interface PDFUploadProps {
  onUploadComplete: (url: string, filename: string) => void;
  currentFile?: string;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export default function PDFUpload({ onUploadComplete, currentFile }: PDFUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<UploadStatus>(currentFile ? 'success' : 'idle');
  const [filename, setFilename] = useState(currentFile || '');
  const [error, setError] = useState('');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const uploadFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      setStatus('error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      setStatus('error');
      return;
    }

    setStatus('uploading');
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      setFilename(result.data.originalName);
      setStatus('success');
      onUploadComplete(result.data.url, result.data.originalName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setStatus('error');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      uploadFile(file);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleRemove = () => {
    setStatus('idle');
    setFilename('');
    setError('');
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-foreground mb-2">
        Course PDF
      </label>

      {status === 'success' ? (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-success bg-success/10">
          <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {filename}
            </p>
            <p className="text-xs text-muted">Uploaded successfully</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRemove}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-8
            transition-all duration-200 cursor-pointer
            ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
            ${status === 'error' ? 'border-error bg-error/5' : ''}
          `}
        >
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={status === 'uploading'}
          />

          <div className="text-center">
            {status === 'uploading' ? (
              <>
                <Spinner size="lg" className="mx-auto mb-4" />
                <p className="text-sm text-muted">Uploading...</p>
              </>
            ) : status === 'error' ? (
              <>
                <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
                <p className="text-sm text-error mb-2">{error}</p>
                <p className="text-xs text-muted">Click or drag to try again</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  {isDragging ? (
                    <FileText className="w-8 h-8 text-primary" />
                  ) : (
                    <Upload className="w-8 h-8 text-primary" />
                  )}
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  {isDragging ? 'Drop your PDF here' : 'Drag & drop your PDF here'}
                </p>
                <p className="text-xs text-muted">
                  or click to browse (max 10MB)
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
