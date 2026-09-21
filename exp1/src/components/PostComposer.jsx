import { useState } from "react";
import { validatePost, platformLimits } from "../utils/validationStrategy";
import { saveDraftMock } from "../utils/mockApi";

function PostComposer({ addDraft }) {
  const [platform, setPlatform] = useState("twitter");
  const [content, setContent] = useState("");

  const validation = validatePost(content, platform);

  const saveDraft = async () => {
    try {
      await saveDraftMock({
        platform,
        content,
      });

      addDraft({
        platform,
        content,
      });

      alert("Draft Saved Successfully");

      setContent("");
    } catch (error) {
      alert("Network Error");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Post Composer</h2>

      <select
        value={platform}
        onChange={(e) => setPlatform(e.target.value)}
      >
        <option value="twitter">Twitter</option>
        <option value="linkedin">LinkedIn</option>
        <option value="instagram">Instagram</option>
      </select>

      <br />
      <br />

      <textarea
        rows="6"
        cols="50"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <p>
        {content.length}/{platformLimits[platform]}
      </p>

      {!validation.isValid && (
        <p style={{ color: "red" }}>{validation.error}</p>
      )}

      <button
        onClick={saveDraft}
        disabled={!validation.isValid}
      >
        Save Draft
      </button>
    </div>
  );
}

export default PostComposer;