import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    // Create admin client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting database reset using RPC function...');

    // Call the database reset RPC function
    const { data, error } = await supabase.rpc('reset_database');

    if (error) {
      console.error('Database reset RPC error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: `Database reset failed: ${error.message}`,
          details: error
        },
        { status: 500 }
      );
    }

    // Log the results
    const summary = data?.summary;
    if (summary) {
      console.log(`Database reset completed:`, {
        totalTables: summary.total_tables,
        successfulTables: summary.successful_tables,
        failedTables: summary.failed_tables,
        totalRowsDeleted: summary.total_rows_deleted
      });

      // Log any failed tables
      const details = data?.details || [];
      const failedTables = details.filter((result: any) => !result.success);
      if (failedTables.length > 0) {
        console.warn('Some tables failed to reset:', failedTables);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Database reset completed successfully. ${summary?.successful_tables || 0}/${summary?.total_tables || 0} tables reset.`,
      data: data,
      summary: {
        tablesReset: summary?.successful_tables || 0,
        totalTables: summary?.total_tables || 0,
        rowsDeleted: summary?.total_rows_deleted || 0,
        preservedTables: summary?.preserved_tables || ['users', 'user_profiles', 'patients', 'medicine_master']
      }
    });

  } catch (error) {
    console.error('Database reset error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'An unexpected error occurred during database reset'
      },
      { status: 500 }
    );
  }
}