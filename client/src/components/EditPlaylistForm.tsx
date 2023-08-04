import { useState } from "react";
import Input from "./Input";
import Button from "./Button";
import Label from "./Label";

interface FormComponentProps {
  onSuccess: () => Promise<void>
  id?: number
  initialName?: string
}

const EditPlaylistForm: React.FC<FormComponentProps> = ({ onSuccess, id, initialName }) => {
  const [name, setName] = useState(initialName);
  const [pendingDelete, setPendingDelete] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await fetch(`http://localhost:8000/playlists/${id}`, {
        headers: {
          "Content-Type": "application/json", // or "multipart/form-data"
        },
        method: "PUT",
        body: JSON.stringify({ name }),
      })
    } catch (e) {
      console.log(e);
    }

    onSuccess().catch(e=>console.log(e));
   // Call setPlaylists with the data variable
  };

  const handleDelete = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await fetch(`http://localhost:8000/playlists/${id}`, {
        method: "DELETE", 
      })
    } catch (e) {
      console.log(e);
    }

    onSuccess().catch(e=>console.log(e));
  };

  return (
    <form className="">
      <div className="mb-4">
        <Label
          htmlFor="name"
        >
          Edit Playlist
        </Label>
        <Input
          type="text"
          id="name"
          value={name ? name : ""}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="flex flex-col  gap-3 ">
        <Button
          color="primary"
          type="submit"
          onClick={handleSubmit}
        >
          Update
        </Button>

        {!pendingDelete && <Button
          type="submit"
          color="neutral"
          onClick={() => setPendingDelete(true)}
        >
          Delete
        </Button>
        }

        { pendingDelete && 
        <>
          Delete this playlist? 
          <Button
          type="submit"
          color="neutral"
          onClick={() => setPendingDelete(false)}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          color="danger"
          onClick={handleDelete}
        >
          Delete '{name}'
        </Button>
        </>
        }
      </div>
    </form>
  );
};

export default EditPlaylistForm;