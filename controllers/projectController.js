import Project from '../models/Project.js';
import User from '../models/User.js';
import Note from '../models/Note.js';
import File from '../models/File.js';

export const createProject = async (req, res) => {
  try {
    const { title, description, isPublic } = req.body;
    if (!title) return res.status(400).json({ message: 'Title required' });
    const project = await Project.create({ title, description, owner: req.user._id, members: [req.user._id], isPublic: !!isPublic });
    return res.status(201).json(project);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const addMember = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.owner.equals(req.user._id)) return res.status(403).json({ message: 'Only owner can add members' });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (project.members.some(m => m.equals(user._id))) return res.status(400).json({ message: 'Already a member' });
    project.members.push(user._id);
    await project.save();
    return res.json(project);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getProjectsForUser = async (req, res) => {
  try {
    const projects = await Project.find({ members: req.user._id }).populate('owner', 'name email');
    return res.json(projects);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id).populate('owner', 'name email').populate('members', 'name email');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const isMember = project.members.some(m => m._id.equals(req.user._id)) || project.owner._id.equals(req.user._id);
    if (!isMember && !project.isPublic) return res.status(403).json({ message: 'Access denied' });
    const projObj = project.toObject();
    if (!projObj.isPublic) delete projObj.publicId;
    return res.json(projObj);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getPublicProject = async (req, res) => {
  try {
    const { id } = req.params;
    // support lookup by publicId or by ObjectId
    let project = null;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      project = await Project.findById(id).populate('owner', 'name email').populate('members', 'name email');
    }
    if (!project) {
      project = await Project.findOne({ publicId: id }).populate('owner', 'name email').populate('members', 'name email');
    }
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.isPublic) return res.status(403).json({ message: 'Project not public' });
    return res.json(project);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const shareProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.owner.equals(req.user._id)) return res.status(403).json({ message: 'Only owner can share project' });
    if (!project.publicId) {
      // generate short random id
      const crypto = await import('crypto');
      const publicId = crypto.randomBytes(6).toString('hex');
      project.publicId = publicId;
    }
    project.isPublic = true;
    await project.save();
    const frontendBase = process.env.FRONTEND_URL || '';
    const shareUrl = `${frontendBase}/public/project/${project.publicId}`;
    return res.json({ success: true, publicId: project.publicId, shareUrl });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const unshareProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.owner.equals(req.user._id)) return res.status(403).json({ message: 'Only owner can unshare project' });
    project.isPublic = false;
    project.publicId = undefined;
    await project.save();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.owner.equals(req.user._id)) return res.status(403).json({ message: 'Only owner can delete project' });

    // remove related notes and files metadata
    await Note.deleteMany({ project: id });
    await File.deleteMany({ project: id });

    await Project.deleteOne({ _id: id });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const contributionAnalytics = async (req, res) => {
  try {
    const { id } = req.params; // project id
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const isMember = project.members.some(m => m.equals(req.user._id)) || project.owner.equals(req.user._id);
    if (!isMember && !project.isPublic) return res.status(403).json({ message: 'Access denied' });

    const notes = await Note.find({ project: id }).populate('author', 'name email');
    const files = await File.find({ project: id }).populate('uploader', 'name email');

    const notesPerUser = {};
    notes.forEach(n => {
      const uid = n.author._id.toString();
      notesPerUser[uid] = notesPerUser[uid] || { user: n.author, count: 0 };
      notesPerUser[uid].count += 1;
    });

    const filesPerUser = {};
    files.forEach(f => {
      const uid = f.uploader._id.toString();
      filesPerUser[uid] = filesPerUser[uid] || { user: f.uploader, count: 0 };
      filesPerUser[uid].count += 1;
    });

    return res.json({ notesPerUser, filesPerUser });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
