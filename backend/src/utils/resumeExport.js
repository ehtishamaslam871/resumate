const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const streamBuffers = require('stream-buffers');

async function generateResumePDF(resume) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const bufferStream = new streamBuffers.WritableStreamBuffer();
    doc.pipe(bufferStream);
    doc.fontSize(20).text(resume.fullName, { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Email: ${resume.email}`);
    doc.text(`Phone: ${resume.phone}`);
    if (resume.location) doc.text(`Location: ${resume.location}`);
    doc.moveDown();
    if (resume.summary) {
      doc.fontSize(14).text('Summary', { underline: true });
      doc.fontSize(12).text(resume.summary);
      doc.moveDown();
    }
    if (resume.skills && resume.skills.length) {
      doc.fontSize(14).text('Skills', { underline: true });
      doc.fontSize(12).text(resume.skills.join(', '));
      doc.moveDown();
    }
    if (resume.experience && resume.experience.length) {
      doc.fontSize(14).text('Experience', { underline: true });
      resume.experience.forEach(exp => {
        doc.fontSize(12).text(`${exp.jobTitle} at ${exp.company} (${exp.duration})`);
        if (exp.description) doc.text(exp.description);
        doc.moveDown();
      });
    }
    if (resume.education && resume.education.length) {
      doc.fontSize(14).text('Education', { underline: true });
      resume.education.forEach(edu => {
        doc.fontSize(12).text(`${edu.degree} in ${edu.field}, ${edu.school} (${edu.year})`);
      });
      doc.moveDown();
    }
    if (resume.projects && resume.projects.length) {
      doc.fontSize(14).text('Projects', { underline: true });
      doc.fontSize(12).text(resume.projects.join(', '));
      doc.moveDown();
    }
    if (resume.certifications && resume.certifications.length) {
      doc.fontSize(14).text('Certifications', { underline: true });
      doc.fontSize(12).text(resume.certifications.join(', '));
      doc.moveDown();
    }
    doc.end();
    bufferStream.on('finish', () => {
      resolve(bufferStream.getBuffer());
    });
    bufferStream.on('error', reject);
  });
}

async function generateResumeDOCX(resume) {
  const doc = new Document();
  const children = [
    new Paragraph({ text: resume.fullName, heading: 'Heading1' }),
    new Paragraph(`Email: ${resume.email}`),
    new Paragraph(`Phone: ${resume.phone}`),
    resume.location ? new Paragraph(`Location: ${resume.location}`) : null,
    resume.summary ? new Paragraph({ text: 'Summary', heading: 'Heading2' }) : null,
    resume.summary ? new Paragraph(resume.summary) : null,
    resume.skills && resume.skills.length ? new Paragraph({ text: 'Skills', heading: 'Heading2' }) : null,
    resume.skills && resume.skills.length ? new Paragraph(resume.skills.join(', ')) : null,
    resume.experience && resume.experience.length ? new Paragraph({ text: 'Experience', heading: 'Heading2' }) : null,
    ...(resume.experience || []).map(exp => new Paragraph(`${exp.jobTitle} at ${exp.company} (${exp.duration})${exp.description ? ': ' + exp.description : ''}`)),
    resume.education && resume.education.length ? new Paragraph({ text: 'Education', heading: 'Heading2' }) : null,
    ...(resume.education || []).map(edu => new Paragraph(`${edu.degree} in ${edu.field}, ${edu.school} (${edu.year})`)),
    resume.projects && resume.projects.length ? new Paragraph({ text: 'Projects', heading: 'Heading2' }) : null,
    resume.projects && resume.projects.length ? new Paragraph(resume.projects.join(', ')) : null,
    resume.certifications && resume.certifications.length ? new Paragraph({ text: 'Certifications', heading: 'Heading2' }) : null,
    resume.certifications && resume.certifications.length ? new Paragraph(resume.certifications.join(', ')) : null,
  ].filter(Boolean);
  doc.addSection({ children });
  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

module.exports = { generateResumePDF, generateResumeDOCX };
