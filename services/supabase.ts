
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

// Kiểm tra kỹ giá trị biến môi trường trước khi khởi tạo
const isValidConfig = supabaseUrl && 
                     supabaseAnonKey && 
                     supabaseUrl !== 'undefined' && 
                     supabaseUrl.startsWith('http');

export const supabase = isValidConfig 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const saveToCloud = async (data: any) => {
  if (!supabase) {
    console.warn('Supabase client not initialized. Check your environment variables.');
    return false;
  }
  
  try {
    const { error } = await supabase
      .from('app_data')
      .upsert({ 
        id: 'kat_edu_master_data', 
        content: data,
        updated_at: new Date().toISOString() 
      }, { onConflict: 'id' });
    
    if (error) {
      console.error('Supabase Upsert Error Detail:', error.message, error.code, error.details);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Unexpected Sync Error:', err);
    return false;
  }
};

export const loadFromCloud = async () => {
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('app_data')
      .select('content')
      .eq('id', 'kat_edu_master_data')
      .maybeSingle();
    
    if (error) {
      console.error('Supabase Load Error Detail:', error.message);
      return null;
    }
    return data?.content || null;
  } catch (err) {
    console.error('Unexpected Load Error:', err);
    return null;
  }
};
