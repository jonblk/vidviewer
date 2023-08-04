import { useState } from "react";
import Label from "./Label";
import Input from "./Input";
import Button from "./Button";

interface FormComponentProps {
  onSuccess: () => Promise<void>
  id?: number
  initialName?: string
}

const NewPlaylistForm: React.FC<FormComponentProps> = ({ onSuccess }) => {
  const [name, setName] = useState("");

  const handleSubmit =  (event: React.FormEvent)  => {
    event.preventDefault();
     fetch("http://localhost:8000/playlists", {
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
        <Label htmlFor="name">
          Playlist name
        </Label>
        <Input type="text" id="name" value={name} onChange={event=>setName(event.target.value)} />
      </div>
      <div className="flex items-center gap-4 ">
        <Button color="primary" type="submit" onClick={handleSubmit}>
          Create
        </Button>
      </div>
    </form>
  );
};

export default NewPlaylistForm;