const Follow = require('../models/followModel');
const User = require('../models/userModel');
const Notification = require('../models/notificationModel');

// Follow a user
exports.followUser = async (req, res) => {
    try {
        const followerId = req.user.userId;
        const { followingUsername } = req.body;

        // Find the follower and the followed user
        const follower = await User.findById(followerId);
        const following = await User.findOne({ username: followingUsername });

        // Check the follower and the followed user existence
        if (!follower) {
            return res.status(400).json({ error: 'Follower not found' });
        }

        if (!following) {
            return res.status(400).json({ error: 'User to follow not found' });
        }

        //  Check if the follower is already following the user
        const existingFollow = await Follow.findOne({ follower_id: follower._id, following_id: following._id});
        if (existingFollow) {
            return res.status(400).json({ error: 'You are already following this user'});
        }

        // Create and save a new follow relationship
        const follow = new Follow({ follower_id: follower._id, following_id: following._id });
        await follow.save();

        // Create a notification for the user being followed
        const notification = new Notification({
            user_id: following._id,
            type: 'follow',
            entity_id: follower._id, 
            message: `${follower.username} started following you`,
        });
        await notification.save();

        res.status(201).json(follow);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Unfollow a user
exports.unfollowUser = async (req, res) => {
    try {
        const followerId = req.user.userId;
        const { followingUsername } = req.body;

        // Find the follower and the user being followed
        const follower = await User.findById(followerId);
        const following = await User.findOne({ username: followingUsername });

        // Check followed user's existence
        if (!following) {
            res.status(400).json({ error: 'User to unfollow not found' });
        }

        //  Find and delete the follow relationship
        const follow = await Follow.findOneAndDelete({ follower_id: follower._id, following_id: following._id });
        if (!follow) {
            return res.status(404).json({ error: 'Follow relationship not found.' });
        }

        res.json({ message: 'Successfully unfollowed the user.' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get a list of a user's followers
exports.getFollowers = async (req, res) => {
    try {
        const username = req.params.username || req.user.username;
        const user = await User.findOne({ username });

        // Check the user's existence
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Find and populate the list of the user's followers
        const followers = await Follow.find({ following_id: user._id }).populate('follower_id', 'username');
        res.json(followers);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get the following list of a user
exports.getFollowing = async (req, res) => {
    try {
        const username = req.params.username || req.user.username;
        const user = await User.findOne({ username });

        // Check for the user's existence
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const following = await Follow.find({ follower_id: user._id }).populate('following_id', 'username');
        res.json(following);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};