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

    const prompt = `Extract the following key details from the provided resume text and return a JSON object with the exact specified keys:  

    {
      "name": "Full Name",
      "contact": {
        "phone": "Phone Number",
        "email": "Email Address"
      },
      "work_experience": [
        {
          "company": "Company Name",
          "position": "Job Title",
          "duration": "Total Duration",
          "start_date": "Start Date (YYYY-MM-DD or best format available)",
          "end_date": "End Date (YYYY-MM-DD or 'Present' if currently employed)",
          "description": "Job Responsibilities and Achievements",
          "employment_type": "Full-time, Part-time, Contract, Internship, etc."
        }
      ]
    }

    Resume Text:
    """${resumeText}"""

    Ensure that the JSON structure strictly follows this format, even if some fields are unavailable. If a field is missing, return it as null. Do not add extra fields.`;

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
