import Note from '../models/Note.js';
import Project from '../models/Project.js';

export const createNote = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, content } = req.body;
    if (!title) return res.status(400).json({ message: 'Title required' });
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const isMember = project.members.some(m => m.equals(req.user._id)) || project.owner.equals(req.user._id);
    if (!isMember && !project.isPublic) return res.status(403).json({ message: 'Access denied' });
    const note = await Note.create({ project: projectId, author: req.user._id, title, content });
    return res.status(201).json(note);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateNote = async (req, res) => {
  try {
    const { id } = req.params; // note id
    const { title, content } = req.body;
    const note = await Note.findById(id).populate('project');
    if (!note) return res.status(404).json({ message: 'Note not found' });
    const project = note.project;
    const isMember = project.members.some(m => m.equals(req.user._id)) || project.owner.equals(req.user._id);
    if (!isMember && !project.isPublic) return res.status(403).json({ message: 'Access denied' });
    if (!note.author.equals(req.user._id) && !project.owner.equals(req.user._id)) return res.status(403).json({ message: 'Only author or owner can update' });
    note.title = title ?? note.title;
    note.content = content ?? note.content;
    note.updatedAt = new Date();
    await note.save();
    return res.json(note);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await Note.findById(id).populate('project');
    if (!note) return res.status(404).json({ message: 'Note not found' });
    const project = note.project;
    if (!note.author.equals(req.user._id) && !project.owner.equals(req.user._id)) return res.status(403).json({ message: 'Only author or owner can delete' });
    await note.remove();
    return res.json({ message: 'Note deleted' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getNotesByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const isMember = project.members.some(m => m.equals(req.user._id)) || project.owner.equals(req.user._id);
    if (!isMember && !project.isPublic) return res.status(403).json({ message: 'Access denied' });
    const notes = await Note.find({ project: projectId }).populate('author', 'name email');
    return res.json(notes);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
