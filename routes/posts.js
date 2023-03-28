import express from 'express'
import {
    addComment,
    createPost,
    deleteComment,
    deletePost,
    getAllComments,
    getFeedPosts,
    getIndividualPost,
    getUserPosts,
    likePost
} from '../controllers/posts.js';
import { verifyToken } from '../middleware/auth.js';
import singleUpload from '../middleware/multer.js';

const router = express.Router();

/* POST*/ 
router.post('/', verifyToken, singleUpload, createPost);

/* READ */
router.get('/', verifyToken, getFeedPosts);
router.get('/:id', getUserPosts);
router.get('/:postId/getpost', getIndividualPost);
router.get('/:postId/getAllComments', verifyToken, getAllComments)

/* UPDATE */
router.patch('/:id/like', verifyToken, likePost);
router.put('/:postId/comment', verifyToken, addComment);

/*DELETE*/
router.delete('/:postId/deletePost', deletePost);
router.delete('/:commentId/deleteComment', deleteComment);

export default router;