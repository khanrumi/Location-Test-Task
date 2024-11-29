import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const prisma = new PrismaClient()
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    const apiKey = process.env.GEOAPIFY_API_KEY;
    const response = await axios.get(`https://api.geoapify.com/v1/geocode/search?text=${query}&apiKey=${apiKey}`);
    const data = response.data;

    if (data.features.length > 0) {
      const location = data.features[0].properties;

      console.log(location,"location")
      
      if (!location.country || !location.city) {
        return NextResponse.json(
          { error: 'Incomplete location data' },
          { status: 400 }
        );
      }

      let state = await prisma.state.upsert({
        where: { name: location.country },
        update: {},
        create: { name: location.country }
      });

      let city = await prisma.city.upsert({
        where: { 
          name_stateId: {
            name: location.city,
            stateId: state.id
          }
        },
        update: {},
        create: {
          name: location.city,
          stateId: state.id
        }
      });

      const otherCities = await prisma.city.findMany({
        where: {
          stateId: state.id,
          id: { not: city.id }
        }
      });

      console.log(otherCities,"otherrrrrrrrrrr")

      for (const otherCity of otherCities) {
        await prisma.neighborhood.upsert({
          where: {
            name_cityId: {
              name: city.name,
              cityId: otherCity.id
            }
          },
          update: {},
          create: {
            name: city.name,
            cityId: otherCity.id
          }
        });

        await prisma.neighborhood.upsert({
          where: {
            name_cityId: {
              name: otherCity.name,
              cityId: city.id
            }
          },
          update: {},
          create: {
            name: otherCity.name,
            cityId: city.id
          }
        });
      }

      const locData = {
        state: state.name,
        city: city.name,
        neighborhoods: otherCities.map(c => c.name)
      };

      return NextResponse.json(
        {
          message: 'Location retrieved and saved successfully',
          locData,
        },
        { status: 200 },
      );
    } else {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error processing location:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}