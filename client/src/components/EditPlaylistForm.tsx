import { useContext, useState } from "react";
import Input from "./Input";
import Button from "./Button";
import Label from "./Label";
import GlobalContext from "../contexts/GlobalContext";

interface FormComponentProps {
  onSuccess: () => Promise<void>
  id?: number
  initialName?: string
}

const EditPlaylistForm: React.FC<FormComponentProps> = ({ onSuccess, id, initialName }) => {
  const [name, setName] = useState(initialName);
  const [pendingDelete, setPendingDelete] = useState(false);
  const rootURL = useContext(GlobalContext)?.rootURL

  const handleSubmit = async (event: React.FormEvent) => {
    if (id === undefined || id === null) {
        throw("Error: playlist id is undefined")
    }
    event.preventDefault();
    try {
      await fetch(`${rootURL}/playlists/${id}`, {
        headers: {
          "Content-Type": "application/json", // or "multipart/form-data"
        },
        method: "PUT",
        body: JSON.stringify({ name }),
      })
      await onSuccess();
    } catch (e) {
      console.log(e);
    }
  };

  const handleDelete = async (event: React.FormEvent) => {
    if (id === undefined || id === null) {
        throw("Error: playlist id is undefined")
    }
    event.preventDefault();
    try {
      const f =  await fetch(`${rootURL}/playlists/${id}`, {
        method: "DELETE", 
      })
      console.log(f.ok)
      await onSuccess();
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <form className="">
      {!pendingDelete && <div className="mb-4">
        <Label htmlFor="playlist-name">
          Playlist name
        </Label>
        <Input
          label="Edit the playlist name"
          type="text"
          id="playlist-name"
          value={name ? name : ""}
          onChange={(event) => setName(event.target.value)}
        />
      </div> }

      <div className="flex flex-col gap-3 ">
        {/* Update button */}
        {!pendingDelete && <Button
          dataTestid="update-playlist"
          color="primary"
          type="submit"
          onClick={(e: React.FormEvent<Element>) => {handleSubmit(e).catch(e=>console.log(e))}}
        >
          Update
        </Button> }

        {!pendingDelete && 
        <Button
          dataTestid="warn-delete-playlist"
          type="button"
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
          dataTestid="delete-playlist"
          type="submit"
          color="danger"
          onClick={(e: React.FormEvent<Element>) => {handleDelete(e).catch(e=>console.log(e))}}
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