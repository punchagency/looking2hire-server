import fs from "fs";
import path from "path";
import { openai } from "../../config/openAi-config";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import textract from "textract";

/**
 * Extracts text from a resume file (PDF, DOCX, DOC)
 */
async function extractTextFromFile(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".pdf") {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text;
  }

  if (ext === ".docx") {
    const dataBuffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer: dataBuffer });
    return result.value;
  }

  if (ext === ".doc") {
    return new Promise((resolve, reject) => {
      textract.fromFileWithPath(filePath, (error, text) => {
        if (error) reject(error);
        else resolve(text);
      });
    });
  }

  throw new Error(
    "Unsupported file type. Only PDF, DOCX, and DOC are allowed."
  );
}

/**
 * Parses a resume using OpenAI
 */
async function parseResume(filePath: string): Promise<any> {
  try {
    const resumeText = await extractTextFromFile(filePath);

    if (!resumeText || resumeText.length < 50) {
      throw new Error("Failed to extract meaningful text from the resume.");
    }

    const prompt = `Extract key details from the following resume text:
    - Name
    - Contact Information (Phone, Email)
    - Work Experience (Company, Position, Duration, Start date, End date, Description, Type of employment)
    
    
    Resume Text:
    """${resumeText}"""

    Provide the output as a JSON object.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const parsedData = response.choices[0]?.message?.content;
    const cleanJson = parsedData?.replace(/^```json|```$/g, "").trim();
    return JSON.parse(cleanJson || "{}");
  } catch (error) {
    console.error("Error parsing resume:", error);
    throw new Error("Resume parsing failed.");
  }
}

export { parseResume };
