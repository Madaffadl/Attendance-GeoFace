import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  
  // 1. Get all classes
  const { data: classes, error } = await supabase
    .from('classes')
    .select('id, class_code');

  if (error || !classes) {
    return NextResponse.json({ success: false, error });
  }

  let updatedCount = 0;
  const updates = [];

  for (const cls of classes) {
    if (cls.class_code !== cls.class_code.toUpperCase()) {
      const newCode = cls.class_code.toUpperCase();
      
      // Update
      const { error: updateError } = await supabase
        .from('classes')
        .update({ class_code: newCode })
        .eq('id', cls.id);
        
      if (!updateError) {
        updatedCount++;
        updates.push({ old: cls.class_code, new: newCode });
      } else {
        console.error(`Failed to update ${cls.class_code}:`, updateError);
        updates.push({ old: cls.class_code, error: updateError.message });
      }
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Migration completed',
    total_classes: classes.length,
    updated_count: updatedCount,
    details: updates
  });
}
