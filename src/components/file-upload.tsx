
"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File as FileIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
}

export function FileUpload({ onFileSelect, disabled }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const selectedFile = acceptedFiles[0];
      if (selectedFile) {
        setFile(selectedFile);
        onFileSelect(selectedFile);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    disabled,
  });

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    onFileSelect(null);
  };

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
        isDragActive
          ? "border-primary bg-primary/10"
          : "border-input hover:border-primary/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />

      {file ? (
        <div className="flex flex-col items-center text-center">
            <FileIcon className="w-10 h-10 text-primary" />
            <p className="mt-2 text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={handleRemoveFile}
            >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove file</span>
            </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center">
            <UploadCloud className="w-10 h-10 text-muted-foreground" />
            <p className="mt-2 text-sm text-foreground">
                <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
                PDF, DOC, DOCX (Max 10MB)
            </p>
        </div>
      )}
    </div>
  );
}
