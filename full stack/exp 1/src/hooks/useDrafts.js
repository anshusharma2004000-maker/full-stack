import { useState, useEffect } from "react";

export const useDrafts = () => {
  const [drafts, setDrafts] = useState(() => {
    const saved = localStorage.getItem("post_drafts");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("post_drafts", JSON.stringify(drafts));
  }, [drafts]);

  const addDraft = (draft) => {
    setDrafts((prev) => [
      {
        id: Date.now(),
        ...draft,
      },
      ...prev,
    ]);
  };

  const deleteDraft = (id) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  return {
    drafts,
    addDraft,
    deleteDraft,
  };
};