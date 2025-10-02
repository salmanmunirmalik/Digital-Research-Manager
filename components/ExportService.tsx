import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExportOptions {
  format: 'pdf' | 'html' | 'json';
  quality: 'high' | 'medium' | 'low';
  includeNotes: boolean;
  theme: string;
}

export interface Slide {
  id: string;
  title: string;
  content: string;
  type: 'title' | 'content' | 'image' | 'chart';
  order: number;
  theme?: string;
}

export interface Presentation {
  id: string;
  title: string;
  slides: Slide[];
  theme: string;
  createdAt: string;
  updatedAt: string;
}

class ExportService {
  async exportToPDF(presentation: Presentation, options: ExportOptions = {
    format: 'pdf',
    quality: 'high',
    includeNotes: false,
    theme: 'research-professional'
  }): Promise<Blob> {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const slideWidth = 297; // A4 landscape width in mm
    const slideHeight = 210; // A4 landscape height in mm
    const margin = 20;
    const contentWidth = slideWidth - (margin * 2);
    const contentHeight = slideHeight - (margin * 2);

    // Add title page
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text(presentation.title, slideWidth / 2, 60, { align: 'center' });
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Created: ${new Date(presentation.createdAt).toLocaleDateString()}`, 
             slideWidth / 2, 80, { align: 'center' });
    
    pdf.text(`Updated: ${new Date(presentation.updatedAt).toLocaleDateString()}`, 
             slideWidth / 2, 95, { align: 'center' });

    pdf.text(`Total Slides: ${presentation.slides.length}`, 
             slideWidth / 2, 110, { align: 'center' });

    // Add each slide
    presentation.slides.forEach((slide, index) => {
      if (index > 0) {
        pdf.addPage();
      }

      // Add slide number
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Slide ${index + 1}`, margin, slideHeight - 10);

      // Add slide title
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      const titleLines = pdf.splitTextToSize(slide.title, contentWidth);
      pdf.text(titleLines, margin, margin + 20);

      // Add slide content
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const contentLines = pdf.splitTextToSize(slide.content, contentWidth);
      pdf.text(contentLines, margin, margin + 40);

      // Add slide type indicator
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.text(`Type: ${slide.type}`, margin, slideHeight - 25);
    });

    return pdf.output('blob');
  }

  async exportToHTML(presentation: Presentation, options: ExportOptions = {
    format: 'html',
    quality: 'high',
    includeNotes: false,
    theme: 'research-professional'
  }): Promise<string> {
    const theme = this.getThemeStyles(options.theme);
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${presentation.title}</title>
    <style>
        ${theme}
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            margin: 0;
            padding: 0;
            background: var(--bg-color);
            color: var(--text-color);
        }
        .presentation-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .slide {
            background: white;
            border-radius: 12px;
            padding: 40px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            page-break-after: always;
            min-height: 600px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        .slide-title {
            font-size: 2.5rem;
            font-weight: bold;
            color: var(--primary-color);
            margin-bottom: 30px;
            text-align: center;
            border-bottom: 3px solid var(--primary-color);
            padding-bottom: 20px;
        }
        .slide-content {
            font-size: 1.2rem;
            line-height: 1.6;
            color: var(--text-color);
            white-space: pre-wrap;
        }
        .slide-number {
            position: absolute;
            bottom: 20px;
            right: 30px;
            font-size: 0.9rem;
            color: var(--secondary-color);
        }
        .slide-type {
            position: absolute;
            bottom: 20px;
            left: 30px;
            font-size: 0.8rem;
            color: var(--accent-color);
            text-transform: uppercase;
            font-weight: bold;
        }
        .presentation-header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
            color: white;
            border-radius: 12px;
        }
        .presentation-title {
            font-size: 3rem;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .presentation-meta {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        @media print {
            .slide {
                page-break-after: always;
                margin: 0;
                border-radius: 0;
                box-shadow: none;
            }
            .presentation-container {
                padding: 0;
            }
        }
    </style>
</head>
<body>
    <div class="presentation-container">
        <div class="presentation-header">
            <h1 class="presentation-title">${presentation.title}</h1>
            <div class="presentation-meta">
                Created: ${new Date(presentation.createdAt).toLocaleDateString()} | 
                Updated: ${new Date(presentation.updatedAt).toLocaleDateString()} | 
                Slides: ${presentation.slides.length}
            </div>
        </div>
        
        ${presentation.slides.map((slide, index) => `
            <div class="slide">
                <div class="slide-number">Slide ${index + 1}</div>
                <div class="slide-type">${slide.type}</div>
                <h2 class="slide-title">${slide.title}</h2>
                <div class="slide-content">${slide.content}</div>
            </div>
        `).join('')}
    </div>
</body>
</html>`;

    return html;
  }

  async exportToJSON(presentation: Presentation): Promise<string> {
    const exportData = {
      ...presentation,
      exportInfo: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        format: 'research-lab-presentation'
      }
    };

    return JSON.stringify(exportData, null, 2);
  }

  async exportSlideAsImage(slide: Slide, containerElement: HTMLElement): Promise<Blob> {
    const canvas = await html2canvas(containerElement, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true
    });

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        }
      }, 'image/png', 0.95);
    });
  }

  private getThemeStyles(themeId: string): string {
    const themes = {
      'research-professional': `
        :root {
            --primary-color: #2563eb;
            --secondary-color: #64748b;
            --accent-color: #0ea5e9;
            --bg-color: #f8fafc;
            --text-color: #1e293b;
        }
      `,
      'academic-classic': `
        :root {
            --primary-color: #1e40af;
            --secondary-color: #6b7280;
            --accent-color: #dc2626;
            --bg-color: #ffffff;
            --text-color: #111827;
        }
      `,
      'modern-scientific': `
        :root {
            --primary-color: #7c3aed;
            --secondary-color: #059669;
            --accent-color: #dc2626;
            --bg-color: #ffffff;
            --text-color: #0f172a;
        }
      `,
      'lab-meeting': `
        :root {
            --primary-color: #dc2626;
            --secondary-color: #f59e0b;
            --accent-color: #10b981;
            --bg-color: #ffffff;
            --text-color: #1f2937;
        }
      `,
      'conference': `
        :root {
            --primary-color: #059669;
            --secondary-color: #0ea5e9;
            --accent-color: #f59e0b;
            --bg-color: #ffffff;
            --text-color: #111827;
        }
      `
    };

    return themes[themeId] || themes['research-professional'];
  }

  downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  downloadHTML(html: string, filename: string): void {
    const blob = new Blob([html], { type: 'text/html' });
    this.downloadFile(blob, filename);
  }

  downloadJSON(json: string, filename: string): void {
    const blob = new Blob([json], { type: 'application/json' });
    this.downloadFile(blob, filename);
  }

  async sharePresentation(presentation: Presentation): Promise<void> {
    if (navigator.share) {
      try {
        const html = await this.exportToHTML(presentation);
        const blob = new Blob([html], { type: 'text/html' });
        const file = new File([blob], `${presentation.title}.html`, { type: 'text/html' });

        await navigator.share({
          title: presentation.title,
          text: `Check out my presentation: ${presentation.title}`,
          files: [file]
        });
      } catch (error) {
        console.error('Error sharing presentation:', error);
        // Fallback to copy link
        this.copyToClipboard(window.location.href);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      this.copyToClipboard(window.location.href);
    }
  }

  private copyToClipboard(text: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        console.log('Presentation link copied to clipboard');
      });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }
}

export const exportService = new ExportService();
