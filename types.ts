
export interface AssetData {
  id: string;
  name: string;
  category: string;
  location: string;
  status: string;
  capacity: number; // Mapping from JUMLAH_KEANGGOTAAN
  femaleStaff: number;
  maleStaff: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  address: string;
  attributes: Record<string, any>;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}
