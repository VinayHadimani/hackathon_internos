import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';

interface ResumeData {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  tailoredResume: string; // The tailored resume is a plain text string
  jobTitle?: string;
  skills?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ResumeData = await request.json();
    const { tailoredResume, name, email, phone, location, jobTitle } = body;

    console.log(`[Download Resume] Generating PDF for ${name || 'unknown user'}...`);

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    const BLUE = [30, 58, 95] as const;
    const DARK = [33, 33, 33] as const;
    const GRAY = [100, 100, 100] as const;

    const checkPageBreak = (needed: number) => {
      if (y + needed > 275) {
        doc.addPage();
        y = 20;
      }
    };

    // ── Header ──
    // Name
    doc.setFontSize(22);
    doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(name || 'Professional Resume', margin, y);
    y += 8;

    // Contact line
    const contactParts = [email, phone, location].filter(Boolean);
    if (contactParts.length > 0) {
      doc.setFontSize(9);
      doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
      doc.setFont('helvetica', 'normal');
      doc.text(contactParts.join('  |  '), margin, y);
      y += 5;
    }

    // Job Title / Subtitle
    if (jobTitle) {
      doc.setFontSize(11);
      doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(`Target Role: ${jobTitle}`, margin, y);
      y += 2;
    }

    // Divider line
    doc.setDrawColor(BLUE[0], BLUE[1], BLUE[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 2, pageWidth - margin, y + 2);
    y += 12;

    if (tailoredResume) {
      const lines = tailoredResume.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) {
          y += 3;
          checkPageBreak(5);
          continue;
        }

        // Check if line is a section header (all caps, short, no punctuation at end)
        const isHeader = /^[A-Z\s\/\-&]+$/.test(line) && line.length < 40 && line.length > 3;

        if (isHeader) {
          y += 4;
          checkPageBreak(15);
          doc.setFontSize(11);
          doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
          doc.setFont('helvetica', 'bold');
          doc.text(line, margin, y);
          y += 6;
          
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.2);
          doc.line(margin, y - 4, pageWidth - margin, y - 4);
        } else if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
          // Bullet point
          checkPageBreak(10);
          doc.setFontSize(9.5);
          doc.setTextColor(DARK[0], DARK[1], DARK[2]);
          doc.setFont('helvetica', 'normal');
          
          const bulletText = line.replace(/^[-•*]\s*/, '').trim();
          const bulletLines = doc.splitTextToSize(`•  ${bulletText}`, contentWidth - 4);
          doc.text(bulletLines, margin + 2, y);
          y += bulletLines.length * 4.5 + 1;
        } else {
          // Regular text (could be a job title, date, or paragraph)
          checkPageBreak(10);
          
          // Heuristic for job titles/dates (e.g., "Software Engineer | 2020 - Present")
          if (line.includes('|') || (line.match(/(19|20)\d{2}/) && line.length < 80)) {
             doc.setFontSize(10);
             doc.setTextColor(DARK[0], DARK[1], DARK[2]);
             doc.setFont('helvetica', 'bold');
          } else {
             doc.setFontSize(9.5);
             doc.setTextColor(DARK[0], DARK[1], DARK[2]);
             doc.setFont('helvetica', 'normal');
          }
          
          const textLines = doc.splitTextToSize(line, contentWidth);
          doc.text(textLines, margin, y);
          y += textLines.length * 4.5 + 1;
        }
      }
    } else {
      doc.setFontSize(10);
      doc.text("No resume content provided.", margin, y);
    }

    console.log('[Download Resume] PDF generated successfully');

    const pdfOutput = doc.output('arraybuffer');
    const pdfUint8 = new Uint8Array(pdfOutput);

    return new NextResponse(pdfUint8, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${(name || 'resume').replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')}_tailored.pdf"`,
      },
    });
  } catch (error) {
    console.error('[Download Resume] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

