import { Injectable } from '@angular/core';
import { PersonalityAnalysis } from './claude.service';
import jsPDF from 'jspdf';


@Injectable({
  providedIn: 'root'
})
export class PdfService {

  constructor() {}

  /**
   * Generate PDF from personality analysis
   */
  async generatePDF(
    analysis: PersonalityAnalysis,
    userName: string,
    userAge: number,
    userEmail: string
  ): Promise<Blob> {
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    let yPosition = margin;

    // Colors
    const primaryColor: [number, number, number] = [147, 51, 234]; // Purple
    const secondaryColor: [number, number, number] = [37, 99, 235]; // Blue
    const textColor: [number, number, number] = [55, 65, 81]; // Gray-700
    const lightGray: [number, number, number] = [243, 244, 246]; // Gray-100

    // Helper function to add new page if needed
    const checkPageBreak = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Helper function to wrap text
    const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number, color: [number, number, number]) => {
      doc.setFontSize(fontSize);
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return lines.length * (fontSize * 0.4); // Return height of text block
    };

    // ========== HEADER ==========
    // Gradient-like header (simulate with rectangles)
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 60, 'F');
    
    doc.setFillColor(...secondaryColor);
    doc.rect(0, 40, pageWidth, 20, 'F');

    // Title
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Your Personality Profile', pageWidth / 2, 25, { align: 'center' });

    // Subtitle
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(`For ${userName}`, pageWidth / 2, 35, { align: 'center' });

    yPosition = 75;

    // ========== PERSONALITY TYPE SECTION ==========
    checkPageBreak(40);
    
    // Section background
    doc.setFillColor(...lightGray);
    doc.roundedRect(margin, yPosition - 5, contentWidth, 35, 3, 3, 'F');

    // Personality type
    doc.setFontSize(22);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text(analysis.personalityType, pageWidth / 2, yPosition + 5, { align: 'center' });

    // Description
    yPosition += 15;
    doc.setFontSize(11);
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(analysis.description, contentWidth - 10);
    doc.text(descLines, pageWidth / 2, yPosition, { align: 'center', maxWidth: contentWidth - 10 });
    
    yPosition += (descLines.length * 5) + 15;

    // ========== STRENGTHS SECTION ==========
    checkPageBreak(60);
    
    doc.setFontSize(16);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text(' Your Strengths', margin, yPosition);
    yPosition += 10;

    analysis.strengths.forEach((strength, index) => {
      checkPageBreak(12);
      
      // Bullet point
      doc.setFillColor(...primaryColor);
      doc.circle(margin + 2, yPosition - 1.5, 1.5, 'F');
      
      // Strength text
      doc.setFontSize(10);
      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'normal');
      const strengthLines = doc.splitTextToSize(strength, contentWidth - 10);
      doc.text(strengthLines, margin + 7, yPosition);
      
      yPosition += strengthLines.length * 5 + 3;
    });

    yPosition += 5;

    // ========== CAREER PATHS SECTION ==========
    checkPageBreak(60);
    
    doc.setFontSize(16);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('🚀 Career Paths For You', margin, yPosition);
    yPosition += 10;

    analysis.careerPaths.forEach((career, index) => {
      checkPageBreak(35);
      
      // Career box
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, yPosition - 3, contentWidth, 30, 2, 2, 'S');
      
      // Number badge
      doc.setFillColor(...primaryColor);
      doc.circle(margin + 5, yPosition + 2, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text((index + 1).toString(), margin + 5, yPosition + 3, { align: 'center' });
      
      // Career title
      doc.setFontSize(12);
      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'bold');
      doc.text(career.title, margin + 12, yPosition + 2);
      
      // Description
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const careerDesc = doc.splitTextToSize(career.description, contentWidth - 15);
      doc.text(careerDesc, margin + 12, yPosition + 8);
      
      // Why good fit
      yPosition += 15;
      doc.setFontSize(8);
      doc.setTextColor(...secondaryColor);
      doc.setFont('helvetica', 'italic');
      const fitLines = doc.splitTextToSize(`Why it fits: ${career.whyGoodFit}`, contentWidth - 15);
      doc.text(fitLines, margin + 12, yPosition);
      
      yPosition += 20;
    });

    // ========== BOOKS SECTION ==========
    checkPageBreak(60);
    
    doc.setFontSize(16);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('📚 Recommended Books', margin, yPosition);
    yPosition += 10;

    analysis.bookRecommendations.forEach((book, index) => {
      checkPageBreak(20);
      
      // Book icon/number
      doc.setFillColor(...secondaryColor);
      doc.circle(margin + 3, yPosition - 1, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text((index + 1).toString(), margin + 3, yPosition, { align: 'center' });
      
      // Book title
      doc.setFontSize(11);
      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'bold');
      doc.text(book.title, margin + 8, yPosition);
      
      // Author
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(107, 114, 128); // Gray-500
      doc.text(`by ${book.author}`, margin + 8, yPosition + 5);
      
      // Reason
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textColor);
      const reasonLines = doc.splitTextToSize(book.reason, contentWidth - 10);
      doc.text(reasonLines, margin + 8, yPosition + 9);
      
      yPosition += 9 + (reasonLines.length * 4) + 5;
    });

    // ========== COURSES SECTION ==========
    checkPageBreak(60);
    
    doc.setFontSize(16);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('🎓 Courses to Explore', margin, yPosition);
    yPosition += 10;

    analysis.courseRecommendations.forEach((course, index) => {
      checkPageBreak(18);
      
      // Course title
      doc.setFontSize(11);
      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${course.title}`, margin, yPosition);
      
      // Platform and level
      doc.setFontSize(9);
      doc.setTextColor(...secondaryColor);
      doc.setFont('helvetica', 'normal');
      doc.text(`${course.platform} • ${course.level}`, margin, yPosition + 5);
      
      // Description
      doc.setFontSize(8);
      doc.setTextColor(...textColor);
      const courseDesc = doc.splitTextToSize(course.description, contentWidth - 5);
      doc.text(courseDesc, margin, yPosition + 9);
      
      yPosition += 9 + (courseDesc.length * 4) + 5;
    });

    // ========== SUMMARY SECTION ==========
    checkPageBreak(40);
    
    doc.setFillColor(254, 252, 232); // Yellow-50
    doc.roundedRect(margin, yPosition - 3, contentWidth, 30, 3, 3, 'F');
    
    doc.setFontSize(14);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('🌟 Your Path Forward', margin + 5, yPosition + 3);
    
    doc.setFontSize(10);
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'normal');
    const summaryLines = doc.splitTextToSize(analysis.summary, contentWidth - 10);
    doc.text(summaryLines, margin + 5, yPosition + 10);

    yPosition += 35;

    // ========== FOOTER ==========
    checkPageBreak(20);
    
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;
    
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated for: ${userEmail}`, margin, yPosition);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin, yPosition, { align: 'right' });
    doc.text('Powered by AI Personality Test', pageWidth / 2, yPosition + 5, { align: 'center' });

    // Return PDF as Blob
    return doc.output('blob');
  }

  /**
   * Download PDF to user's computer
   */
  async downloadPDF(
    analysis: PersonalityAnalysis,
    userName: string,
    userAge: number,
    userEmail: string
  ): Promise<void> {
    const pdfBlob = await this.generatePDF(analysis, userName, userAge, userEmail);
    
    // Create download link
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${userName.replace(/\s+/g, '_')}_Personality_Profile.pdf`;
    link.click();
    
    // Clean up
    URL.revokeObjectURL(url);
  }

  /**
   * Get PDF as base64 string (for email attachment)
   */
  async getPDFAsBase64(
    analysis: PersonalityAnalysis,
    userName: string,
    userAge: number,
    userEmail: string
  ): Promise<string> {
    const pdfBlob = await this.generatePDF(analysis, userName, userAge, userEmail);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(pdfBlob);
    });
  }
}