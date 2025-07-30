import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { MVPResponse } from '@/types/mvp';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<MVPResponse>({ error: 'Unauthorized - Please log in to access MVPs' }, { status: 401 });
    }

    // Fetch the MVP - RLS will ensure user can only access their own MVPs
    const { data: mvp, error } = await supabase.from('mvps').select('*').eq('id', id).eq('user_id', user.id).single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json<MVPResponse>({ error: 'MVP not found' }, { status: 404 });
      }

      console.error('Supabase error:', error);
      return NextResponse.json<MVPResponse>({ error: 'Failed to fetch MVP' }, { status: 500 });
    }

    return NextResponse.json<MVPResponse>({
      data: mvp,
      message: 'MVP retrieved successfully',
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json<MVPResponse>({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<MVPResponse>({ error: 'Unauthorized - Please log in to update MVPs' }, { status: 401 });
    }

    const body = await request.json();

    // Remove user_id and id from update data for security
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_id, id: bodyId, created_at, updated_at, ...updateData } = body;

    // Update the MVP - RLS will ensure user can only update their own MVPs
    const { data: updatedMvp, error } = await supabase
      .from('mvps')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json<MVPResponse>({ error: 'MVP not found or access denied' }, { status: 404 });
      }

      console.error('Supabase update error:', error);
      return NextResponse.json<MVPResponse>({ error: 'Failed to update MVP' }, { status: 500 });
    }

    return NextResponse.json<MVPResponse>({
      data: updatedMvp,
      message: 'MVP updated successfully',
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json<MVPResponse>({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<MVPResponse>({ error: 'Unauthorized - Please log in to delete MVPs' }, { status: 401 });
    }

    // Delete the MVP - RLS will ensure user can only delete their own MVPs
    const { error } = await supabase.from('mvps').delete().eq('id', id).eq('user_id', user.id);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json<MVPResponse>({ error: 'Failed to delete MVP' }, { status: 500 });
    }

    return NextResponse.json<MVPResponse>({
      message: 'MVP deleted successfully',
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json<MVPResponse>({ error: 'Internal server error' }, { status: 500 });
  }
}
