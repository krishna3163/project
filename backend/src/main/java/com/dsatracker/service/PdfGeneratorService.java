package com.dsatracker.service;

import com.dsatracker.model.MockResult;
import com.dsatracker.model.MockTest;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.awt.Color;
import java.util.Map;

@Slf4j
@Service
public class PdfGeneratorService {

    public byte[] generateTestReport(MockResult result, MockTest test, String userName) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 36, 36, 54, 36);

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Font Settings
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, Color.DARK_GRAY);
            Font sectionTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, new Color(79, 70, 229));
            Font textFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.BLACK);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE);

            // Document Header
            Paragraph docTitle = new Paragraph("PREPNEST MOCK TEST REPORT", titleFont);
            docTitle.setAlignment(Element.ALIGN_CENTER);
            docTitle.setSpacingAfter(20);
            document.add(docTitle);

            // Overview Section
            Paragraph overviewTitle = new Paragraph("Overview", sectionTitleFont);
            overviewTitle.setSpacingAfter(10);
            document.add(overviewTitle);

            PdfPTable overviewTable = new PdfPTable(2);
            overviewTable.setWidthPercentage(100);
            overviewTable.setSpacingAfter(20);

            addTableCell(overviewTable, "Candidate Name:", boldFont);
            addTableCell(overviewTable, userName, textFont);
            addTableCell(overviewTable, "Test Title:", boldFont);
            addTableCell(overviewTable, test.getTitle(), textFont);
            addTableCell(overviewTable, "Score:", boldFont);
            addTableCell(overviewTable, result.getScore() + " / " + result.getTotalMarks() + " (" + String.format("%.2f", result.getPercentage()) + "%)", textFont);
            addTableCell(overviewTable, "Global Rank:", boldFont);
            addTableCell(overviewTable, "#" + result.getRank() + " of " + result.getTotalUsers(), textFont);
            addTableCell(overviewTable, "Percentile:", boldFont);
            addTableCell(overviewTable, String.format("%.2f", result.getPercentile()) + "%", textFont);
            addTableCell(overviewTable, "Time Taken:", boldFont);
            addTableCell(overviewTable, (result.getTimeTaken() / 60) + " min " + (result.getTimeTaken() % 60) + " sec", textFont);
            addTableCell(overviewTable, "Accuracy:", boldFont);
            addTableCell(overviewTable, String.format("%.2f", result.getAccuracy() * 100) + "%", textFont);
            addTableCell(overviewTable, "Badge Earned:", boldFont);
            addTableCell(overviewTable, result.getBadge(), textFont);

            document.add(overviewTable);

            // Topic Breakdown Section
            Paragraph topicTitle = new Paragraph("Topic-wise Breakdown", sectionTitleFont);
            topicTitle.setSpacingAfter(10);
            document.add(topicTitle);

            PdfPTable topicTable = new PdfPTable(4);
            topicTable.setWidthPercentage(100);
            topicTable.setSpacingAfter(20);

            // Set Header Cells
            Color headerBg = new Color(79, 70, 229);
            addHeaderCell(topicTable, "Topic", headerFont, headerBg);
            addHeaderCell(topicTable, "Correct Marks", headerFont, headerBg);
            addHeaderCell(topicTable, "Total Marks", headerFont, headerBg);
            addHeaderCell(topicTable, "Accuracy %", headerFont, headerBg);

            for (Map.Entry<String, MockResult.TopicScore> entry : result.getTopicBreakdown().entrySet()) {
                addTableCell(topicTable, entry.getKey(), textFont);
                addTableCell(topicTable, String.valueOf(entry.getValue().getCorrect()), textFont);
                addTableCell(topicTable, String.valueOf(entry.getValue().getTotal()), textFont);
                addTableCell(topicTable, String.format("%.2f", entry.getValue().getScore()) + "%", textFont);
            }

            document.add(topicTable);

            // Footer / Congratulations
            Paragraph footer = new Paragraph("Congratulations on completing the test! Keep practicing to achieve a perfect score.", textFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            footer.setSpacingBefore(30);
            document.add(footer);

            document.close();
        } catch (DocumentException e) {
            log.error("Failed to generate PDF report: {}", e.getMessage());
        }

        return out.toByteArray();
    }

    private void addTableCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(8);
        cell.setBorderColor(new Color(229, 231, 235));
        table.addCell(cell);
    }

    private void addHeaderCell(PdfPTable table, String text, Font font, Color bgColor) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(bgColor);
        cell.setPadding(10);
        cell.setBorderColor(new Color(229, 231, 235));
        table.addCell(cell);
    }
}
