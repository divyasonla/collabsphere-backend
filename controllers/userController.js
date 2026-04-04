import User from '../models/User.js';
import Project from '../models/Project.js';
import mongoose from 'mongoose';

export const getMyProfile = async (req, res) => {
  try {
    if (!req.user) {
      console.error('getMyProfile: req.user is missing');
      return res.status(401).json({ message: 'Not authenticated' });
    }
    const userId = req.user._id;
    // console.log('getMyProfile called for user:', userId.toString());
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // projects by this user
    const projects = await Project.find({ owner: userId }).sort({ createdAt: -1 });
    const projectsCount = projects.length;

    // aggregation: projects per day (convert id to string first)
    try {
      const ownerId = userId.toString();
      const agg = await Project.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(ownerId) } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);
    //   console.log('getMyProfile aggregation result:', agg);
      const submissionsByDate = {};
      agg.forEach(a => { submissionsByDate[a._id] = a.count; });
      return res.json({ user, projectsCount, projects, submissionsByDate });
    } catch (aggErr) {
    //   console.error('getMyProfile aggregation error:', aggErr);
      return res.status(500).json({ message: 'Aggregation error', error: aggErr.message, stack: aggErr.stack });
    }
  } catch (err) {
    console.error('getMyProfile error:', err);
    return res.status(500).json({ message: err.message, stack: err.stack });
  }
};

export const getProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const projects = await Project.find({ owner: id }).sort({ createdAt: -1 });
    const projectsCount = projects.length;

    const agg = await Project.aggregate([
      { $match: { owner: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    const submissionsByDate = {};
    agg.forEach(a => { submissionsByDate[a._id] = a.count; });

    return res.json({ user, projectsCount, projects, submissionsByDate });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
