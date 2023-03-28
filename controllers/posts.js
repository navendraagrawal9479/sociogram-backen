import Post from "../models/post.js";
import User from "../models/user.js";
import { Comment } from "../models/post.js";
import mongoose from "mongoose";
import getDataUri from "../utils/dataUri.js";
import cloudinary from 'cloudinary';

/* CREATE */
export const createPost = async (req, res) => {
  try {
    const { userId, description } = req.body;
    const user = await User.findById(userId);
    const file = req.file;

    const fileUrl = getDataUri(file);
    
    const cloudUri = await cloudinary.uploader.upload(fileUrl.content);

    const newPost = new Post({
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      location: user.location,
      description,
      userPicturePath: user.picturePath,
      picturePath: cloudUri.secure_url,
      imageId: cloudUri.public_id,
      likes: {},
      comments: [],
    });

    await newPost.save();
    res.status(201).json({
      message: "Post Uploaded Successfully",
      post: newPost,
    });
  } catch (err) {
    res.status(409).json({ message: err.message });
  }
};

/* READ */
export const getFeedPosts = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const totalPosts = await Post.find().countDocuments();
    const items_per_page = process.env.ITEMS_PER_PAGE;
    const posts = await Post.find()
      .sort({ createdAt: "descending" })
      .skip((page - 1) * items_per_page) //skip these nnumber of records in the beginning
      .limit(items_per_page);
    res.status(200).json({
      posts,
      metaData: { totalPosts, postsPerPage: items_per_page },
    });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const id = req.params.id;
    const page = Number(req.query.page) || 1;
    const totalPosts = await Post.find({ userId: id }).countDocuments();
    const items_per_page = process.env.ITEMS_PER_PAGE;
    const posts = await Post.find({ userId: id })
      .sort({ createdAt: "descending" })
      .skip((page - 1) * items_per_page) //skip these nnumber of records in the beginning
      .limit(items_per_page);
    res.status(200).json({
      posts,
      metaData: { totalPosts, postsPerPage: items_per_page },
    });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getIndividualPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);

    if (!post) {
      const error = new Error("Post not found.");
      throw error;
    }

    res.status(200).json(post);
  } catch (err) {
    res.status(404).json({
      message: err.message,
    });
  }
};

/* UPDATE */
export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const post = await Post.findById(id);
    const isLiked = post.likes.get(userId);
    console.log(isLiked); // gets the boolean by the mapping of userIds

    if (isLiked) {
      post.likes.delete(userId);
    } else {
      post.likes.set(userId, true);
    }

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { likes: post.likes },
      { new: true } // to return the post after the update
    );

    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const addComment = async (req, res) => {
  try {
    const {
      userId,
      postUserId,
      description,
      name,
      location,
      userPicturePath,
    } = req.body;

    const { postId } = req.params;

    const comment = new Comment({
      postId,
      postUserId,
      userId,
      description,
      name,
      location,
      userPicturePath,
    });

    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Post not found.");
      throw error;
    }

    comment.save();
    post.comments.push(comment._id);

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { comments: post.comments },
      { new: true }
    );

    res.status(201).json({
      message: "Comment added.",
      post: updatedPost,
    });
  } catch (err) {
    res.status(404).json({
      message: err.message,
    });
  }
};

export const getAllComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const page = Number(req.query.page) || 1;

    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Post not found.");
      throw error;
    }

    const totalComments = await Comment.find({
      postId: postId,
    }).countDocuments();
    const items_per_page = process.env.ITEMS_PER_PAGE;

    const comments = await Comment.find({ postId: postId })
      .sort({ createdAt: "descending" })
      .skip((page - 1) * items_per_page) //skip these nnumber of records in the beginning
      .limit(items_per_page);

    res.status(200).json({
      comments,
      metaData: { totalComments, commentsPerPage: items_per_page },
    });
  } catch (err) {
    res.status(404).json({
      message: err.message,
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    await Comment.deleteMany({
      postId: postId,
    });

    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Post not found.");
      throw error;
    }
    await cloudinary.uploader.destroy(post.imageId);

    await Post.findByIdAndRemove(postId);
    console.log("function Called.");

    res.status(204).json({
      message: "Post Deleted",
    });
  } catch (err) {
    res.status(404).json({
      message: err.message,
    });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      const error = new Error("Comment not found.");
      throw error;
    }
    const post = await Post.findById(comment.postId);
    
    const newComments = post.comments.filter((comment) => {
      return String(comment._id) !== commentId;
    });

    const updatedPost = await Post.findByIdAndUpdate(
      comment.postId,
      { comments: newComments },
      { new: true }
    );

    await Comment.findByIdAndRemove(commentId);

    res.status(204).json({
      message: "Comment Deleted.",
      post: updatedPost,
    });
  } catch (err) {
    res.status(404).json({
      message: err.message,
    });
  }
};
