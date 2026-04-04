import * as geminiService from '../utils/geminiService.js';
const maskedKey = (k) => {
  if (!k) return null;
  return k.length > 8 ? `${k.slice(0,4)}...${k.slice(-4)}` : '****';
}

export const explain = async (req, res) => {
  try {
    console.log('GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY, 'masked:', maskedKey(process.env.GEMINI_API_KEY));
    const { text, language } = req.body;
    if (!text) return res.status(400).json({ message: 'Text is required' });
    const prompt = `Explain the following code or note in clear terms. Include examples if helpful.\n\n${text}`;
    const result = await geminiService.generate({ prompt, purpose: 'explain', language });
    if (!result.success) console.error('Gemini generate failed:', result.details || result.error);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const docs = async (req, res) => {
  try {
    console.log('GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY, 'masked:', maskedKey(process.env.GEMINI_API_KEY));
    const { code, projectContext } = req.body;
    if (!code) return res.status(400).json({ message: 'Code is required' });
    const prompt = `Generate developer-facing documentation for the following code. Include usage examples and API reference if applicable.\n\nContext: ${projectContext || 'None'}\n\n${code}`;
    const result = await geminiService.generate({ prompt, purpose: 'docs' });
    if (!result.success) console.error('Gemini generate failed:', result.details || result.error);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const readme = async (req, res) => {
  try {
    console.log('GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY, 'masked:', maskedKey(process.env.GEMINI_API_KEY));
    const { projectInfo } = req.body;
    if (!projectInfo) return res.status(400).json({ message: 'Project info is required' });
    // Ask the model explicitly for a long, detailed README in Markdown only
    const prompt = `You are an expert technical writer. Produce a long, detailed Markdown README for the project described below. Include these sections: Title, Short Description, Features, Installation, Configuration, Usage Examples, API (if applicable), Environment/Configuration, Testing, Contributing, Troubleshooting, FAQ, and License. Write in clear, user-friendly language and include code blocks where appropriate. Output ONLY the README content in Markdown (no extra commentary).\n\nProject information:\n${projectInfo}\n\nPlease produce a comprehensive README of substantial length (several paragraphs per section).`;
    const result = await geminiService.generate({ prompt, purpose: 'readme' });
    if (!result.success) console.error('Gemini generate failed:', result.details || result.error);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
