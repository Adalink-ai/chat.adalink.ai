import { NextResponse } from 'next/server';
import { getAllowedProviders, getAllowedModels } from '@/lib/ai/providers';

export async function GET() {
  try {
    const allowedProviders = getAllowedProviders();
    const allowedModels = getAllowedModels();
    
    return NextResponse.json({
      allowedProviders,
      allowedModels,
      // If empty array, it means all providers/models are allowed
      allowAllProviders: allowedProviders.length === 0,
      allowAllModels: allowedModels.length === 0,
    });
  } catch (error) {
    console.error('Error getting allowed providers and models:', error);
    return NextResponse.json(
      { error: 'Failed to get allowed providers and models' },
      { status: 500 }
    );
  }
}