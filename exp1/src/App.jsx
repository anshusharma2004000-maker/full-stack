import PostComposer from "./components/PostComposer";
import { useDrafts } from "./hooks/useDrafts";

function App() {
  const { drafts, addDraft, deleteDraft } = useDrafts();

  return (
    <div>
      <PostComposer addDraft={addDraft} />

      <hr />

      <h2>Saved Drafts</h2>

      {drafts.map((draft) => (
        <div
          key={draft.id}
          style={{
            border: "1px solid gray",
            margin: "10px",
            padding: "10px",
          }}
        >
          <h3>{draft.platform}</h3>
          <p>{draft.content}</p>

          <button onClick={() => deleteDraft(draft.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

export default App;