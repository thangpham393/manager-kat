
import { createClient } from '@supabase/supabase-js';

// Sử dụng process.env để tương thích tốt nhất với môi trường deploy và Vercel
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

// Khởi tạo client chỉ khi có đủ thông tin, nếu không sẽ trả về null
export const supabase = (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'undefined') 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const saveToCloud = async (data: any) => {
  if (!supabase) return false;
  
  try {
    const { error } = await supabase
      .from('app_data')
      .upsert({ 
        id: 'kat_edu_master_data', 
        content: data,
        updated_at: new Date().toISOString() 
      }, { onConflict: 'id' });
    
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Supabase Sync Error:', err);
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
      .maybeSingle(); // Sử dụng maybeSingle để không lỗi nếu bảng trống
    
    if (error) throw error;
    return data?.content || null;
  } catch (err) {
    console.error('Supabase Load Error:', err);
    return null;
  }
};
