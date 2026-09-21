import { useEffect, useState } from "react";
import type { Role } from "../utils/auth";

interface Post {
  id: number;
  title: string;
  content: string;
  createdBy: string;
}

interface PostManagerProps {
  role: Role;
}

const POSTS_KEY = "rbac_posts";

const defaultPosts: Post[] = [
  {
    id: 1,
    title: "Welcome Post",
    content: "This is the first post.",
    createdBy: "admin",
  },
  {
    id: 2,
    title: "JWT Authentication",
    content:
      "This post demonstrates JWT authentication and role-based access control.",
    createdBy: "admin",
  },
];

function PostManager({ role }: PostManagerProps) {
  const [posts, setPosts] = useState<Post[]>(() => {
    const savedPosts = localStorage.getItem(POSTS_KEY);

    if (!savedPosts) {
      return defaultPosts;
    }

    try {
      return JSON.parse(savedPosts) as Post[];
    } catch {
      return defaultPosts;
    }
  });

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);

  const [viewingPost, setViewingPost] = useState<Post | null>(
    null
  );

  const canCreate = role === "admin";

  const canEdit =
    role === "admin" || role === "editor";

  const canDelete = role === "admin";

  /*
   * Save posts whenever they change.
   */
  useEffect(() => {
    localStorage.setItem(
      POSTS_KEY,
      JSON.stringify(posts)
    );
  }, [posts]);

  /*
   * CREATE POST
   */
  const createPost = () => {
    if (!canCreate) {
      return;
    }

    if (!title.trim() || !content.trim()) {
      alert("Please enter both title and content.");
      return;
    }

    const newPost: Post = {
      id: Date.now(),
      title: title.trim(),
      content: content.trim(),
      createdBy: role,
    };

    setPosts((currentPosts) => [
      ...currentPosts,
      newPost,
    ]);

    setTitle("");
    setContent("");

    alert("Post created successfully!");
  };

  /*
   * VIEW POST
   */
  const viewPost = (post: Post) => {
    setViewingPost(post);
  };

  /*
   * CLOSE VIEW
   */
  const closeView = () => {
    setViewingPost(null);
  };

  /*
   * START EDITING
   */
  const startEdit = (post: Post) => {
    if (!canEdit) {
      return;
    }

    setEditingId(post.id);
    setTitle(post.title);
    setContent(post.content);

    // Close the view modal if it is open.
    setViewingPost(null);
  };

  /*
   * UPDATE POST
   */
  const updatePost = () => {
    if (!canEdit) {
      return;
    }

    if (editingId === null) {
      return;
    }

    if (!title.trim() || !content.trim()) {
      alert("Please enter both title and content.");
      return;
    }

    setPosts((currentPosts) =>
      currentPosts.map((post) => {
        if (post.id === editingId) {
          return {
            ...post,
            title: title.trim(),
            content: content.trim(),
          };
        }

        return post;
      })
    );

    setEditingId(null);
    setTitle("");
    setContent("");

    alert("Post updated successfully!");
  };

  /*
   * CANCEL EDITING
   */
  const cancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
  };

  /*
   * DELETE POST
   */
  const deletePost = (id: number) => {
    if (!canDelete) {
      return;
    }

    setPosts((currentPosts) =>
      currentPosts.filter(
        (post) => post.id !== id
      )
    );

    if (viewingPost?.id === id) {
      setViewingPost(null);
    }

    if (editingId === id) {
      cancelEdit();
    }

    alert("Post deleted successfully!");
  };

  return (
    <div className="posts-section">

      {/* =========================
          PERMISSIONS
      ========================= */}

      <div className="permission-box">
        <h3>Your Permissions</h3>

        <p>
          <span>View Posts:</span> ✅
        </p>

        <p>
          <span>Create Posts:</span>{" "}
          {canCreate ? "✅" : "❌"}
        </p>

        <p>
          <span>Edit Posts:</span>{" "}
          {canEdit ? "✅" : "❌"}
        </p>

        <p>
          <span>Delete Posts:</span>{" "}
          {canDelete ? "✅" : "❌"}
        </p>
      </div>


      {/* =========================
          CREATE POST
      ========================= */}

      {canCreate && editingId === null && (
        <div className="post-form">
          <h3>Create New Post</h3>

          <input
            type="text"
            placeholder="Post title"
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
          />

          <textarea
            rows={5}
            placeholder="Write your post..."
            value={content}
            onChange={(event) =>
              setContent(event.target.value)
            }
          />

          <button
            type="button"
            onClick={createPost}
          >
            Create Post
          </button>
        </div>
      )}


      {/* =========================
          EDIT POST
      ========================= */}

      {canEdit && editingId !== null && (
        <div className="post-form">
          <h3>Edit Post</h3>

          <input
            type="text"
            placeholder="Post title"
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
          />

          <textarea
            rows={5}
            placeholder="Write your post..."
            value={content}
            onChange={(event) =>
              setContent(event.target.value)
            }
          />

          <button
            type="button"
            onClick={updatePost}
          >
            Update Post
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={cancelEdit}
          >
            Cancel
          </button>
        </div>
      )}


      {/* =========================
          POSTS
      ========================= */}

      <h3>Available Posts</h3>

      <div className="post-list">

        {posts.length === 0 ? (
          <p>No posts available.</p>
        ) : (
          posts.map((post) => (
            <div
              className="post-card"
              key={post.id}
            >
              <h3>{post.title}</h3>

              <p>
                {post.content.length > 100
                  ? `${post.content.substring(
                      0,
                      100
                    )}...`
                  : post.content}
              </p>

              <small>
                Created by:{" "}
                <strong>{post.createdBy}</strong>
              </small>

              <div className="post-actions">

                {/* VIEW - EVERY USER */}

                <button
                  type="button"
                  className="view-button"
                  onClick={() => viewPost(post)}
                >
                  View
                </button>

                {/* EDIT - ADMIN + EDITOR */}

                {canEdit && (
                  <button
                    type="button"
                    onClick={() => startEdit(post)}
                  >
                    Edit
                  </button>
                )}

                {/* DELETE - ADMIN ONLY */}

                {canDelete && (
                  <button
                    type="button"
                    className="delete-button"
                    onClick={() =>
                      deletePost(post.id)
                    }
                  >
                    Delete
                  </button>
                )}

              </div>
            </div>
          ))
        )}

      </div>


      {/* =========================
          VIEW POST MODAL
      ========================= */}

      {viewingPost !== null && (
        <div className="modal-overlay">

          <div className="view-modal">

            <button
              type="button"
              className="close-button"
              onClick={closeView}
              aria-label="Close"
            >
              ×
            </button>

            <h2>{viewingPost.title}</h2>

            <p className="modal-content">
              {viewingPost.content}
            </p>

            <div className="modal-author">
              Created by:{" "}
              <strong>
                {viewingPost.createdBy}
              </strong>
            </div>

            <button
              type="button"
              className="modal-close-button"
              onClick={closeView}
            >
              Close
            </button>

          </div>

        </div>
      )}

    </div>
  );
}

export default PostManager;