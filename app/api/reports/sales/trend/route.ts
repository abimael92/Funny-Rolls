import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const days = parseInt(searchParams.get('days') || '30');

	try {
		const result = await sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        COALESCE(SUM(total), 0) as sales,
        COALESCE(AVG(total), 0) as average
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

		return NextResponse.json(result);
	} catch (error) {
		console.error('Error fetching trend data:', error);
		return NextResponse.json([]);
	}
}
