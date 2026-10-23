
// FIX: Add import for React to resolve 'Cannot find namespace React' error.
import React from 'react';

export type ReportStatus = 'Báo cáo mới' | 'Đang xử lý' | 'Đã xử lý';

export interface AIAnalysis {
  issueType: 'Xả rác không đúng nơi quy định' | 'Ngập lụt' | 'Sạt lở đất' | 'Cần chăm sóc cây xanh' | 'Khác' | 'Không có sự cố' | 'Đang chờ phân tích';
  description: string;
  priority: 'Cao' | 'Trung bình' | 'Thấp';
  solution: string; // Giải pháp do AI đề xuất
  isIssuePresent: boolean; // Cờ để xác thực hình ảnh/video có sự cố môi trường
  recommendedSupplies?: string[]; // Danh sách nhu yếu phẩm (cho thiên tai)
}

export interface EnvironmentalReport {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  latitude: number;
  longitude: number;
  userDescription?: string;
  description: string; // AI Description
  aiAnalysis: AIAnalysis;
  status: ReportStatus;
  timestamp: Date;
  area?: string;
  reporter?: string;
}

export interface GroundingChunk {
  maps?: {
    uri: string;
    title: string;
  };
  web?: {
    uri: string;
    title: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  suggestions?: string[];
  groundingChunks?: GroundingChunk[];
  imageUrl?: string;
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning';
}

export interface EducationalTopic {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  details: {
    importance: string;
    solutions: { title: string; description: string }[];
    tip: string;
  };
}

export type POIType = 'NatureReserve' | 'RecyclingCenter' | 'CommunityCleanup' | 'WaterStation' | 'RiskPoint';

export interface EnvironmentalPOI {
  id: string;
  type: POIType;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  forecast: {
    date: string;
    temp: number;
    condition: string;
  }[];
}

export type ImageValidationStatus = 'idle' | 'analyzing' | 'valid' | 'invalid';

export interface EnvironmentalNotification {
  id: number;
  userId: number;
  reportId: string;
  message: string;
  type: 'new_report' | 'status_update' | 'emergency';
  isRead: boolean;
  created_at: string;
  area?: string;
  issueType?: string;
  priority?: string;
}
