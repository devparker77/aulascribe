import { jsPDF } from 'jspdf';
import { Lecture } from '@/types/lecture';

export function exportLectureToPdf(lecture: Lecture) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - margin) {
      doc.addPage();
      cursorY = margin;
      return true;
    }
    return false;
  };

  // Cabeçalho / Banner
  doc.setFillColor(37, 99, 235); // Blue 600
  doc.rect(0, 0, pageWidth, 24, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('AulaScribe - Dossiê de Estudos & Transcrição', margin, 12);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, 18);
  
  cursorY = 32;

  // Título da Aula
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const splitTitle = doc.splitTextToSize(lecture.title, contentWidth);
  doc.text(splitTitle, margin, cursorY);
  cursorY += splitTitle.length * 7 + 2;

  // Informações da Matéria e Data
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // Slate 500
  const dateFormatted = new Date(lecture.createdAt).toLocaleDateString('pt-BR');
  doc.text(`Disciplina: ${lecture.subject || 'Geral'}  |  Data da Gravação: ${dateFormatted}`, margin, cursorY);
  cursorY += 8;

  // Linha divisória
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 8;

  // Seção 1: Resumo Executivo
  checkPageBreak(25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 58, 138); // Blue 900
  doc.text('1. RESUMO EXECUTIVO DA AULA', margin, cursorY);
  cursorY += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  
  // Limpa markdown tags do resumo
  const cleanSummary = lecture.summary
    .replace(/#{1,6}\s?/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '• ');
    
  const splitSummary = doc.splitTextToSize(cleanSummary, contentWidth);
  for (const line of splitSummary) {
    checkPageBreak(5);
    doc.text(line, margin, cursorY);
    cursorY += 5;
  }
  cursorY += 6;

  // Seção 2: Alertas de Prova (se houver)
  if (lecture.examAlerts && lecture.examAlerts.length > 0) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(185, 28, 28); // Red 700
    doc.text('2. ALERTAS DE PROVA & PONTOS CRÍTICOS', margin, cursorY);
    cursorY += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);

    for (const alert of lecture.examAlerts) {
      checkPageBreak(8);
      const splitAlert = doc.splitTextToSize(`⚠️ ${alert}`, contentWidth);
      doc.text(splitAlert, margin, cursorY);
      cursorY += splitAlert.length * 5 + 2;
    }
    cursorY += 4;
  }

  // Seção 3: Tópicos Principais
  if (lecture.keyTopics && lecture.keyTopics.length > 0) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 58, 138);
    doc.text('3. TÓPICOS E CONCEITOS-CHAVE', margin, cursorY);
    cursorY += 6;

    for (const topic of lecture.keyTopics) {
      checkPageBreak(15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`• ${topic.title}`, margin, cursorY);
      cursorY += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const splitExp = doc.splitTextToSize(topic.explanation, contentWidth - 5);
      for (const line of splitExp) {
        checkPageBreak(4.5);
        doc.text(line, margin + 5, cursorY);
        cursorY += 4.5;
      }
      cursorY += 3;
    }
    cursorY += 4;
  }

  // Seção 4: Flashcards de Revisão
  if (lecture.flashcards && lecture.flashcards.length > 0) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 58, 138);
    doc.text('4. FLASHCARDS DE REVISÃO', margin, cursorY);
    cursorY += 6;

    lecture.flashcards.forEach((fc, idx) => {
      checkPageBreak(16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      const splitQ = doc.splitTextToSize(`Q${idx + 1}: ${fc.question}`, contentWidth);
      doc.text(splitQ, margin, cursorY);
      cursorY += splitQ.length * 4.5 + 1;

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      const splitA = doc.splitTextToSize(`R: ${fc.answer}`, contentWidth - 4);
      doc.text(splitA, margin + 4, cursorY);
      cursorY += splitA.length * 4.5 + 3;
    });
    cursorY += 4;
  }

  // Seção 5: Transcrição Completa com Timestamps
  if (lecture.segments && lecture.segments.length > 0) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 58, 138);
    doc.text('5. TRANSCRIÇÃO INTEGRAL DA AULA', margin, cursorY);
    cursorY += 6;

    for (const seg of lecture.segments) {
      checkPageBreak(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(2, 132, 199); // Sky 600
      doc.text(`[${seg.time}] ${seg.speaker || 'Professor'}:`, margin, cursorY);
      cursorY += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      const splitSeg = doc.splitTextToSize(seg.text, contentWidth);
      for (const line of splitSeg) {
        checkPageBreak(4.5);
        doc.text(line, margin, cursorY);
        cursorY += 4.5;
      }
      cursorY += 2;
    }
  }

  // Numeração de Páginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Página ${i} de ${totalPages} - AulaScribe`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  // Salva o PDF
  const filename = `${(lecture.subject || 'Aula').replace(/\s+/g, '_')}_${(lecture.title || 'Transcricao').replace(/\s+/g, '_').substring(0, 30)}.pdf`;
  doc.save(filename);
}

export function exportLectureToText(lecture: Lecture): string {
  let text = `# ${lecture.title}\n`;
  text += `Disciplina: ${lecture.subject}\n`;
  text += `Data: ${new Date(lecture.createdAt).toLocaleDateString('pt-BR')}\n\n`;

  text += `## 1. Resumo Executivo\n${lecture.summary}\n\n`;

  if (lecture.examAlerts && lecture.examAlerts.length > 0) {
    text += `## 2. Alertas de Prova\n`;
    lecture.examAlerts.forEach((a, i) => {
      text += `- ⚠️ ${a}\n`;
    });
    text += `\n`;
  }

  if (lecture.keyTopics && lecture.keyTopics.length > 0) {
    text += `## 3. Tópicos Principais\n`;
    lecture.keyTopics.forEach((t) => {
      text += `### ${t.title}\n${t.explanation}\n\n`;
    });
  }

  if (lecture.flashcards && lecture.flashcards.length > 0) {
    text += `## 4. Flashcards de Revisão\n`;
    lecture.flashcards.forEach((f, i) => {
      text += `**P${i + 1}: ${f.question}**\n*R: ${f.answer}*\n\n`;
    });
  }

  if (lecture.segments && lecture.segments.length > 0) {
    text += `## 5. Transcrição Completa\n`;
    lecture.segments.forEach((s) => {
      text += `[${s.time}] **${s.speaker}**: ${s.text}\n\n`;
    });
  }

  return text;
}
