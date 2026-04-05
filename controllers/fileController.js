import path from 'path';
import fs from 'fs';
import FileModel from '../models/File.js';
import Project from '../models/Project.js';

export const uploadFile = async (req, res) => {
  try {
    const { projectId } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    let project = null;
    if (projectId) {
      project = await Project.findById(projectId);
      if (!project) return res.status(404).json({ message: 'Project not found' });
      const isMember = project.members.some(m => m.equals(req.user._id)) || project.owner.equals(req.user._id);
      if (!isMember && !project.isPublic) return res.status(403).json({ message: 'Access denied' });
    }
    const file = await FileModel.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      uploader: req.user._id,
      project: projectId || null
    });
    return res.status(201).json(file);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getFile = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await FileModel.findById(id).populate('uploader', 'name email');
    if (!file) return res.status(404).json({ message: 'File not found' });
    // Permission: if file linked to project, only members or public can preview
    if (file.project) {
      const project = await Project.findById(file.project);
      if (!project) return res.status(404).json({ message: 'Project not found' });
      const isMember = project.members.some(m => m.equals(req.user._id)) || project.owner.equals(req.user._id);
      if (!isMember && !project.isPublic) return res.status(403).json({ message: 'Access denied' });
    }
    const ext = path.extname(file.originalName || file.filename).toLowerCase();
    const streamPath = path.resolve(file.path);
    if (file.mimeType.startsWith('image/')) {
      return res.sendFile(streamPath);
    }
    // For text-based files, stream as text
    if (file.mimeType.startsWith('text/') || ['.md', '.txt', '.json', '.js', '.py'].includes(ext)) {
      const content = fs.readFileSync(streamPath, 'utf8');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.send(content);
    }
    // Fallback: download
    return res.download(streamPath, file.originalName);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getFilesByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const isMember = project.members.some(m => m.equals(req.user._id)) || project.owner.equals(req.user._id);
    if (!isMember && !project.isPublic) return res.status(403).json({ message: 'Access denied' });
    const files = await FileModel.find({ project: projectId }).populate('uploader', 'name email');
    return res.json(files);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getPublicFilesByProject = async (req, res) => {
  try {
    const { id } = req.params;
    let project = null;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      project = await Project.findById(id);
    }
    if (!project) {
      project = await Project.findOne({ publicId: id });
    }
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.isPublic) return res.status(403).json({ message: 'Project not public' });
    const files = await FileModel.find({ project: project._id }).populate('uploader', 'name email');
    return res.json(files);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
