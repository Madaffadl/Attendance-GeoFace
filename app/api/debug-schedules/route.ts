import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  
  // Get all classes
  const { data: classes, error } = await supabase
    .from('classes')
    .select('id, class_name, schedule, class_code');

  if (error) return NextResponse.json({ error });

  const analysis = classes?.map((cls: any) => {
      let type = 'legacy_string';
      let parsed = null;
      try {
          parsed = JSON.parse(cls.schedule);
          type = 'json';
      } catch (e) {}

      return {
          id: cls.id,
          name: cls.class_name,
          raw_schedule: cls.schedule,
          type,
          parsed
      };
  });

  return NextResponse.json({ 
    count: classes?.length,
    date_check: new Date().toString(),
    classes: analysis 
  });
}
