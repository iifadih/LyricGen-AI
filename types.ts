
export interface SongData {
  title: string;
  lyrics: string;
  styles: string[];
  imagePrompt: string;
  moodDescription: string;
  groundingSources?: Array<{ web: { uri?: string; title?: string } }>;
}

export enum Language {
  Arabic = "Arabic",
  English = "English",
  Spanish = "Spanish",
  French = "French",
  German = "German",
  Japanese = "Japanese"
}

export interface GeneratedAsset {
  type: 'image' | 'video';
  url: string;
  loading: boolean;
  error?: string;
}
