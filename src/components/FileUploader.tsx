
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, FileText } from 'lucide-react';

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
  hasChats: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload, hasChats }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('Selected file:', file);
    
    if (file) {
      // Check if it's a text file by extension or MIME type
      const isTextFile = file.name.toLowerCase().endsWith('.txt') || 
                        file.type === 'text/plain' || 
                        file.type === '' || // Sometimes text files have empty MIME type
                        file.type.startsWith('text/');
      
      console.log('File type:', file.type);
      console.log('File name:', file.name);
      console.log('Is text file:', isTextFile);
      
      if (isTextFile) {
        onFileUpload(file);
      } else {
        alert(`Please select a valid WhatsApp chat text file (.txt). Selected file type: ${file.type || 'unknown'}`);
      }
    } else {
      alert('No file selected');
    }
    
    // Clear the input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  if (hasChats) {
    return (
      <div className="p-4 border-b">
        <Button
          variant="outline"
          onClick={handleUploadClick}
          className="w-full flex items-center space-x-2"
        >
          <Upload className="h-4 w-4" />
          <span>Upload Another Chat File</span>
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,text/plain"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full p-8">
      <Card className="p-8 text-center max-w-md mx-auto">
        <div className="mb-6">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Import WhatsApp Chats</h2>
          <p className="text-muted-foreground mb-6">
            Upload your exported WhatsApp chat text files to view and search through your conversations.
          </p>
        </div>
        
        <Button
          onClick={handleUploadClick}
          className="w-full flex items-center space-x-2"
        >
          <Upload className="h-4 w-4" />
          <span>Choose Chat File</span>
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,text/plain"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="mt-4 text-sm text-muted-foreground">
          <p>Supported format: .txt files</p>
          <p className="mt-1">
            To export chats from WhatsApp: Chat → More → Export Chat → Without Media
          </p>
        </div>
      </Card>
    </div>
  );
};

export default FileUploader;
