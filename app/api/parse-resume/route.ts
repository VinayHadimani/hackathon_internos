import { NextRequest, NextResponse } from 'next/server';
import { extractText } from 'unpdf';
import { applyResumeQualityGuard } from '@/lib/resume-quality-guard';
import { callAI } from '@/lib/rotating-ai';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    console.log('[Parse Resume] Received request');

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      console.log('[Parse Resume] No file provided');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('[Parse Resume] File:', file.name, 'Type:', file.type, 'Size:', file.size);

    const supportedTypes = ['application/pdf', 'text/plain', 'image/jpeg', 'image/png', 'image/webp'];
    if (!supportedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a PDF, TXT, or Image (JPEG/PNG).' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    console.log('[Parse Resume] Converting to Uint8Array...');
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    let trimmedText = '';
    let totalPages = 1;

    if (file.type === 'text/plain') {
      trimmedText = new TextDecoder('utf-8').decode(uint8Array).trim();
    } else if (file.type === 'application/pdf') {
      console.log('[Parse Resume] Parsing PDF with unpdf...');
      const result = await extractText(uint8Array, { mergePages: true });
      totalPages = result.totalPages || 1;
      trimmedText = result.text?.trim() || '';

      if (!trimmedText) {
        console.log('[Parse Resume] No text extracted via unpdf. Attempting AI extraction for image-based PDF...');
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const aiResponse = await callAI(
          "Extract all the text from this resume document. Output ONLY the raw text exactly as it appears, preserving the logical order of sections. Do not add any conversational text or markdown formatting.",
          "Please extract the text.",
          {
            image: { base64, mimeType: file.type }
          }
        );
        if (aiResponse.success && aiResponse.content) {
          trimmedText = aiResponse.content.trim();
        }
      }
    } else if (file.type.startsWith('image/')) {
      console.log('[Parse Resume] Extracting text from image via AI...');
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const aiResponse = await callAI(
        "Extract all the text from this resume image. Output ONLY the raw text exactly as it appears, preserving the logical order of sections (e.g. Summary, Experience, Education, Skills). Do not add any conversational text or markdown formatting.",
        "Please extract the text from this resume.",
        {
          image: { base64, mimeType: file.type }
        }
      );
      if (aiResponse.success && aiResponse.content) {
        trimmedText = aiResponse.content.trim();
      } else {
        throw new Error(aiResponse.error || "Failed to extract text from image");
      }
    }

    if (!trimmedText) {
      console.log('[Parse Resume] No text extracted');
      return NextResponse.json(
        { error: 'Could not extract text from this file. Please ensure the file is readable.' },
        { status: 422 }
      );
    }

    const guardedText = applyResumeQualityGuard(trimmedText, true);

    console.log('[Parse Resume] Success — text length:', guardedText.length);

    return NextResponse.json({
      text: guardedText,
      pages: totalPages,
      fileName: file.name,
    });
  } catch (error) {
    console.error('[Parse Resume] Error:', error);

    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      { error: `Failed to parse file: ${message}` },
      { status: 500 }
    );
  }
}
