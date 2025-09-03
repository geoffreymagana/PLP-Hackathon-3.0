
"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { useToast } from "@/hooks/use-toast";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  language: string;
  value: string;
  className?: string;
}

export function CodeBlock({
  language,
  value,
  className,
  ...props
}: CodeBlockProps) {
  const [hasCopied, setHasCopied] = useState(false);
  const { toast } = useToast();

  const onCopy = async () => {
    try {
      // Fallback for when clipboard API is not available
      if (!navigator.clipboard) {
        const textArea = document.createElement('textarea');
        textArea.value = value;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      } else {
        await navigator.clipboard.writeText(value);
      }
      
      setHasCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Code has been copied to your clipboard",
      });
      
      setTimeout(() => setHasCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast({
        title: "Copy failed",
        description: "Failed to copy code to clipboard",
        variant: "destructive",
      });
    }
  };

  // Don't render if no value
  if (!value || value.trim() === '') {
    return null;
  }

  return (
    <div className="relative group" role="region" aria-label={`Code block: ${language}`}>
      <div
        className={cn(
          "flex items-center justify-between w-full rounded-t-lg px-4 py-2",
          "bg-[#0D1164] border-b"
        )}
      >
        <span className="text-xs font-mono text-white lowercase">
          {language || 'text'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-white hover:bg-white/10"
          onClick={onCopy}
          aria-label="Copy code"
        >
          {hasCopied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{ 
          margin: 0, 
          padding: '1rem',
          backgroundColor: '#0D1164',
          borderRadius: '0 0 0.5rem 0.5rem',
          border: '1px solid hsl(var(--border))',
          borderTop: 'none',
        }}
        codeTagProps={{
            ...props,
            className: cn("font-mono text-sm", className)
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}
