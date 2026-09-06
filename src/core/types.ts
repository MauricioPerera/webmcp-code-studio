/**
 * Core type definitions for WebMCP Code Studio
 */

export interface VFSFile {
  type: 'file';
  path: string;
  name: string;
  content: string;
  updatedAt: number;
}

export interface VFSDirectory {
  type: 'directory';
  path: string;
  name: string;
  children: string[]; // List of paths of direct children
  updatedAt: number;
}

export type VFSNode = VFSFile | VFSDirectory;

export interface OpenTab {
  path: string;
  isDirty: boolean;
  modelUri?: string;
}

export interface WebMcpToolParam {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

export interface WebMcpToolMetadata {
  name: string;
  description: string;
  parameters: WebMcpToolParam[];
  readOnlyHint?: boolean;
}

export interface WebMcpExecutionLog {
  id: string;
  toolName: string;
  timestamp: number;
  args: Record<string, unknown>;
  result?: unknown;
  error?: string;
  status: 'success' | 'error' | 'pending';
}

export interface ConsoleLogMessage {
  type: 'log' | 'warn' | 'error' | 'info';
  messages: string[];
  timestamp: number;
}
