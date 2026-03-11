import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET() {
	const { data, error } = await supabase
		.from('settings')
		.select('*')
		.maybeSingle();

	if (error)
		return NextResponse.json(
			{ error: 'Error obteniendo configuración' },
			{ status: 500 },
		);

	return NextResponse.json(data || null);
}

export async function PUT(req: Request) {
	try {
		const body = await req.json();
		const { store_name, tax_rate, receipt_footer } = body;

		// Convierte tax_rate a número
		const numericTax = parseFloat(tax_rate);

		const { data, error } = await supabase
			.from('settings')
			.upsert(
				{ store_name, tax_rate: numericTax, receipt_footer },
				{ onConflict: 'id', returning: 'representation' },
			)
			.maybeSingle();

		if (error) throw error;

		return NextResponse.json(data);
	} catch (err) {
		console.error('PUT settings error:', err);
		return NextResponse.json(
			{ error: 'Error guardando configuración' },
			{ status: 500 },
		);
	}
}
