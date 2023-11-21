import { useContext, useState } from "react";
import Label from "./Label";
import Input from "./Input";
import Button from "./Button";
import GlobalContext from "../contexts/GlobalContext";

interface FormComponentProps {
  onSuccess: () => Promise<void>
  id?: number
  initialName?: string
}

const NewPlaylistForm: React.FC<FormComponentProps> = ({ onSuccess }) => {
  const [name, setName] = useState("");
  const rootURL = useContext(GlobalContext)?.rootURL

  const handleSubmit =  (event: React.FormEvent)  => {
    event.preventDefault();
     fetch(`${rootURL}/playlists`, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded", // or "multipart/form-data"
        },
        method: "POST",
        body: JSON.stringify({ name }),
      }).then(_ => onSuccess().catch(e=>console.log(e)))
      .catch((e) =>console.log(e)) 
    }

  return (
    <form className="flex-col flex w-full">
      <div className="mb-4 w-full">
        <Label htmlFor="playlist-name">
          New Playlist
        </Label>
        <Input autoFocus={true} label="New Playlist" type="text" id="playlist-name" value={name} onChange={event=>setName(event.target.value)} />
      </div>
      <div className="flex items-center gap-4 ">
        <Button data-testid="create-playlist-button" color="primary" type="submit" onClick={handleSubmit}>
          Create
        </Button>
      </div>
    </form>
  );
};

export default NewPlaylistForm;