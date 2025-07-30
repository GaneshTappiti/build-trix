import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { MVPListResponse } from '@/types/mvp';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<MVPListResponse>(
        { error: 'Unauthorized - Please log in to access your MVPs' },
        { status: 401 },
      );
    }

    // Extract query parameters for filtering and sorting
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = searchParams.get('limit');

    // Build the query
    let query = supabase.from('mvps').select('*').eq('user_id', user.id);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply limit if specified
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        query = query.limit(limitNum);
      }
    }

    const { data: mvps, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json<MVPListResponse>({ error: 'Failed to fetch MVPs' }, { status: 500 });
    }

    return NextResponse.json<MVPListResponse>({
      data: mvps || [],
      message: `Found ${mvps?.length || 0} MVPs`,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json<MVPListResponse>({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<MVPListResponse>(
        { error: 'Unauthorized - Please log in to create MVPs' },
        { status: 401 },
      );
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['app_name', 'platforms', 'style', 'app_description', 'generated_prompt'];
    const missingFields = requiredFields.filter((field) => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json<MVPListResponse>(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 },
      );
    }

    // Insert the new MVP
    const { data: newMvp, error } = await supabase
      .from('mvps')
      .insert([
        {
          ...body,
          user_id: user.id,
          status: body.status || 'Yet To Build',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json<MVPListResponse>({ error: 'Failed to create MVP' }, { status: 500 });
    }

    return NextResponse.json<MVPListResponse>({ data: [newMvp], message: 'MVP created successfully' }, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json<MVPListResponse>({ error: 'Internal server error' }, { status: 500 });
  }
}
