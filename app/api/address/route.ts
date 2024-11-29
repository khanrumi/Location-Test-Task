import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';


export async function GET() {
    const prisma = new PrismaClient()
    try {
        const [cities, states, neighborhoods] = await Promise.all([
            prisma.city.findMany({
                orderBy: { name: 'asc' },
            }),
            prisma.state.findMany({
                orderBy: { name: 'asc' },
            }),
            prisma.neighborhood.findMany({
                orderBy: { name: 'asc' },
            }),
        ]);

        return NextResponse.json({
            cities,
            states,
            neighborhoods,
        });
    } catch (error) {
        console.error('Error fetching address data:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 },
        );
    }
}
