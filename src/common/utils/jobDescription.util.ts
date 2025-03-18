import { openai } from "../../config/openAi-config";

async function generateJobDescription(
  job_title: string,
  qualifications: string[],
  company_name: string
): Promise<any> {
  try {
    const prompt = `
Generate a JSON-formatted job description with the following structure:

{
  "job_title": "Job Title",
  "company_name": "Company Name",
  "summary": "Brief summary of the role and responsibilities.",
  "key_responsibilities": [
    "Responsibility 1",
    "Responsibility 2",
    ...
  ],
  "qualifications": [
    "Qualification 1",
    "Qualification 2",
    ...
  ],
  "closing_statement": "Final statement encouraging applicants to apply."
}

Ensure that the JSON strictly follows this format. Generate a natural number of responsibilities and qualifications based on the role's complexity.

**Job Title:** ${job_title}  
**Qualifications:** ${qualifications.join(", ")}
**Company Name:** ${company_name}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const parsedData = response.choices[0]?.message?.content;
    const cleanJson = parsedData?.replace(/^```json|```$/g, "").trim();
    return JSON.parse(cleanJson || "{}");
  } catch (error) {
    console.error("Error generating job description:", error);
    throw new Error("Job description generation failed.");
  }
}

export default generateJobDescription;
