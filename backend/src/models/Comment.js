import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    post_id: { type: Number, required: true, index: true },
    author_id: { type: Number, required: true, index: true },
    author_name: { type: String, default: '' },
    color: { type: String, default: 'bg-[#ffdad6]' },
    text: { type: String, required: true, maxlength: 300, trim: true },
    created_at: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

commentSchema.index({ post_id: 1, created_at: 1 });

export const Comment = mongoose.models.Comment || mongoose.model('Comment', commentSchema);

export default Comment;
