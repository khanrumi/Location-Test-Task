// app/actions/location.ts

'use server';
import { PrismaClient, State, City, Neighborhood, Address } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

interface LocationResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Get all states
export async function getStates(): Promise<LocationResponse<State[]>> {
  try {
    const states = await prisma.state.findMany({
      orderBy: { name: 'asc' },
    });
    return { success: true, data: states };
  } catch (error) {
    console.error('Error fetching states:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Get cities by state
export async function getCitiesByState(stateId: number): Promise<LocationResponse<City[]>> {
  try {
    const cities = await prisma.city.findMany({
      where: { stateId },
      orderBy: { name: 'asc' },
    });
    return { success: true, data: cities };
  } catch (error) {
    console.error('Error fetching cities:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Get neighborhoods by city
export async function getNeighborhoodsByCity(cityId: number): Promise<LocationResponse<Neighborhood[]>> {
  try {
    const neighborhoods = await prisma.neighborhood.findMany({
      where: { cityId },
      orderBy: { name: 'asc' },
    });
    return { success: true, data: neighborhoods };
  } catch (error) {
    console.error('Error fetching neighborhoods:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Add new state if it doesn't exist
export async function addState(name: string): Promise<LocationResponse<State>> {
  if (!name.trim()) {
    return { success: false, error: 'State name cannot be empty' };
  }
  try {
    const state = await prisma.state.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    revalidatePath('/');
    return { success: true, data: state };
  } catch (error) {
    console.error('Error adding state:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Add new city if it doesn't exist
export async function addCity(name: string, stateId: number): Promise<LocationResponse<City>> {
  if (!name.trim()) {
    return { success: false, error: 'City name cannot be empty' };
  }
  try {
    const city = await prisma.city.upsert({
      where: {
        name_stateId: {
          name: name,
          stateId: stateId
        }
      },
      update: {},
      create: {
        name: name,
        stateId: stateId
      }
    });
    revalidatePath('/');
    return { success: true, data: city };
  } catch (error) {
    console.error('Error adding city:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Add new neighborhood if it doesn't exist
export async function addNeighborhood(name: string, cityId: number): Promise<LocationResponse<Neighborhood>> {
  if (!name.trim()) {
    return { success: false, error: 'Neighborhood name cannot be empty' };
  }
  try {
    const neighborhood = await prisma.neighborhood.upsert({
      where: {
        name_cityId: {
          name: name,
          cityId: cityId
        }
      },
      update: {},
      create: {
        name: name,
        cityId: cityId
      }
    });
    revalidatePath('/');
    return { success: true, data: neighborhood };
  } catch (error) {
    console.error('Error adding neighborhood:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Save address
export async function saveAddress(data: {
  address: string;
  neighborhoodId: number;
  googleSearch?: string;
  phone: string;
}): Promise<LocationResponse<Address>> {
  try {
    const address = await prisma.address.create({
      data: {
        address: data.address,
        neighborhoodId: data.neighborhoodId,
        googleSearch: data.googleSearch,
        phone: data.phone
      }
    });
    revalidatePath('/');
    return { success: true, data: address };
  } catch (error) {
    console.error('Error saving address:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
