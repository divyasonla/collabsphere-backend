import * as geminiService from '../utils/geminiService.js';

export const explain = async (req, res) => {
  try {
    const { text, language } = req.body;
    if (!text) return res.status(400).json({ message: 'Text is required' });
    const prompt = `Explain the following code or note in clear terms. Include examples if helpful.\n\n${text}`;
    const result = await geminiService.generate({ prompt, purpose: 'explain', language });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const docs = async (req, res) => {
  try {
    const { code, projectContext } = req.body;
    if (!code) return res.status(400).json({ message: 'Code is required' });
    const prompt = `Generate developer-facing documentation for the following code. Include usage examples and API reference if applicable.\n\nContext: ${projectContext || 'None'}\n\n${code}`;
    const result = await geminiService.generate({ prompt, purpose: 'docs' });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const readme = async (req, res) => {
  try {
    const { projectInfo } = req.body;
    if (!projectInfo) return res.status(400).json({ message: 'Project info is required' });
    const prompt = `Create a professional README.md for the project described below. Include setup, usage, examples, and contribution guidelines.\n\n${projectInfo}`;
    const result = await geminiService.generate({ prompt, purpose: 'readme' });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
