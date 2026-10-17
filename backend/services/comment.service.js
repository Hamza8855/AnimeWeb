import Comment from "@/models/Comment";

// GET ALL VISIBLE COMMENTS OF A VIDEO

export const getVideoComments = async (videoId) => {
  return await Comment.find({
    video: videoId,
    status: "visible",
  })
    .populate("user", "name username avatar")
    .sort({ createdAt: -1 });
};

// GET ALL COMMENTS FOR ADMIN
// ========================================

export const getAllComments = async () => {
  return await Comment.find()
    .populate("user", "name username avatar")
    .populate("video", "title youtubeId")
    .sort({ createdAt: -1 });
};

// GET COMMENT BY ID
// ========================================

export const findCommentById = async (commentId) => {
  return await Comment.findById(commentId)
    .populate("user", "name username avatar")
    .populate("video", "title youtubeId");
};

// ========================================
// CREATE COMMENT
// ========================================

export const createComment = async (commentData) => {
  return await Comment.create(commentData);
};

// ========================================
// UPDATE OWN COMMENT
// USER CAN EDIT ONLY WITHIN 2 DAYS
// ========================================

export const updateComment = async (commentId, userId, text) => {
  // Find user's own comment
  const comment = await Comment.findOne({
    _id: commentId,
    user: userId,
    status: {
      $ne: "deleted",
    },
  });

  if (!comment) {
    return null;
  }

  // ========================================
  // CHECK 2-DAY EDIT LIMIT
  // ========================================

  const now = new Date();

  const createdAt = new Date(comment.createdAt);

  const twoDaysInMilliseconds = 2 * 24 * 60 * 60 * 1000;

  const timePassed = now.getTime() - createdAt.getTime();

  // More than or equal to 2 days
  if (timePassed >= twoDaysInMilliseconds) {
    return {
      editNotAllowed: true,
    };
  }

  // ========================================
  // UPDATE COMMENT
  // ========================================

  comment.text = text;

  await comment.save();

  // Return populated comment
  return await Comment.findById(comment._id)
    .populate("user", "name username avatar")
    .populate("video", "title youtubeId");
};

// ========================================
// DELETE OWN COMMENT
// USER CAN DELETE ANYTIME
// ========================================

export const deleteOwnComment = async (commentId, userId) => {
  return await Comment.findOneAndUpdate(
    {
      _id: commentId,
      user: userId,
      status: {
        $ne: "deleted",
      },
    },
    {
      status: "deleted",
    },
    {
      new: true,
    },
  );
};

// ========================================
// ADMIN HIDE COMMENT
// ========================================

export const hideComment = async (commentId) => {
  return await Comment.findByIdAndUpdate(
    commentId,
    {
      status: "hidden",
    },
    {
      new: true,
    },
  );
};

// ========================================
// ADMIN SHOW COMMENT
// ========================================

export const showComment = async (commentId) => {
  return await Comment.findByIdAndUpdate(
    commentId,
    {
      status: "visible",
    },
    {
      new: true,
    },
  );
};

// ========================================
// ADMIN DELETE COMMENT PERMANENTLY
// ========================================

export const deleteComment = async (commentId) => {
  return await Comment.findByIdAndDelete(commentId);
};
