import React, { useState } from "react";
import { Playlist } from "./../App";
import Label from "./Label";
import Input from "./Input";
import Button from "./Button";
import Dropdown, { Option } from "./Dropdown";

interface AddVideoFormProps {
  playlists: Playlist[];
  onSuccess: () => void
}

const AddVideoForm: React.FC<AddVideoFormProps> = ({ playlists, onSuccess }) => {
  const [url, setUrl] = useState("");
  const [selectedPlaylist, setSelectedPlaylist] = useState<number | null>(null);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handlePlaylistChange = (option: Option) => {
    setSelectedPlaylist(+option.value);
  };

  const handleSubmit = (e: React.FormEvent<Element>) => {
    e.preventDefault();

    if (selectedPlaylist !== null) {
      //const formData = { url, playlistId: selectedPlaylist };
      const formData = new URLSearchParams();
      formData.append("url", url);
      formData.append("playlistId", String(selectedPlaylist));

      const requestOptions: RequestInit = {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded"},
        body: formData.toString(),
      };

      fetch("http://localhost:8000/videos", requestOptions)
        .then((response) => {
          if (response.status === 200) {
            console.log("returned success")
            onSuccess();
          } else {
            console.error(response.statusText);
          }
        })
        .catch((error) => {
          console.error("Error sending the POST request:", error);
        });
        
    }
  };

  return (
    <form className={"flex flex-col gap-3"} onSubmit={handleSubmit}>
      <div>
        <Label htmlFor="url">URL:</Label>
        <Input type="text" id="url" value={url} onChange={handleUrlChange} />
      </div>
      <div>
        <Label htmlFor="playlist">Playlist:</Label>
        <Dropdown
          options={playlists.map(p=>{return{label:p.name, value: p.id}})}
          onSelect={handlePlaylistChange}
        />
      </div>
      <Button onClick={handleSubmit} color="primary" type="submit">
        Add Video
      </Button>
    </form>
  );
};

export default AddVideoForm;