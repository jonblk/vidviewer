import Input from "./Input";
import Button from "./Button";
import Label from "./Label";
import CheckboxList from "./CheckboxList";
import { Playlist } from "../App";
 import { useEffect, useState } from "react";

interface FormComponentProps {
  onSuccess: () => Promise<void>
  id: number
  initialTitle?: string
  allPlaylists: Playlist[]
}

type VideoPlaylist = {
  id: number,
  checked: boolean
  name: string
}

const EditVideoForm: React.FC<FormComponentProps> = ({allPlaylists, onSuccess, id, initialTitle }) => {
  const [title, setName] = useState(initialTitle);
  const [videoPlaylists, setVideoPlaylists] = useState<VideoPlaylist[]>(allPlaylists.map(p=>({id: p.id, name: p.name, checked: false})));
  const [pendingDelete, setPendingDelete] = useState(false);

  // On mount get the video's playlists
  useEffect(() => {
    const getPlaylists = async () => {
      //Returns an array of the video's playlists
      const response = await fetch(`https://localhost:8000/video_playlists/${id}`)
      const json = await response.json() as Playlist[]
      console.log(json)
      setVideoPlaylists(vps=> vps.map(vp=>({...vp, checked: json.some(p=>p.id === vp.id)})))
    }

    getPlaylists().catch(e=>console.log(e))
  }, [id])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await fetch(`https://localhost:8000/videos/${id}`, {
        headers: {
          "Content-Type": "application/json", // or "multipart/form-data"
        },
        method: "PUT",
        body: JSON.stringify({ title, videoPlaylists }),
      })
      onSuccess().catch(e=>console.log(e));
    } catch (e) {
      console.log(e);
    }
  };

  const handleDelete = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch(`https://localhost:8000/videos/${id}`, {
        method: "DELETE", 
      })

      if (response.ok) {
        onSuccess().catch(e=>console.log(e));
      } else {
        console.log("Error editing video")
      }
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <form className="relative max-h-[330px] min-h-[280px]">
   {pendingDelete && (
          <div className="flex flex-col gap-3">
            Delete this video?  
            <p className="text-neutral-400">
            "{title}"</p>
            <Button
              type="submit"
              color="neutral"
              onClick={() => setPendingDelete(false)}
            >
              Cancel
            </Button>
            <Button type="submit" color="danger" onClick={handleDelete}>
              Delete 
            </Button>
          </div>
        )}
      {!pendingDelete && <div className="flex flex-col gap-3 overflow-auto h-[90%]">
        <div>
          <Label htmlFor="title">Video title</Label>
          <Input
            label="title"
            type="text"
            id="title"
            value={title ? title : ""}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="Playlists">Playlists</Label>

          <CheckboxList<number>
            options={
              videoPlaylists.map(p => {
                return {
                  label:   p.name, 
                  value:   p.id, 
                  checked: p.checked 
                }
              })
            }
            onSelectionChange={(id: number, isChecked: boolean) => { 
              setVideoPlaylists(vps=>vps.map(vp=>({...vp, checked: (id === vp.id ? isChecked : vp.checked)})))
            }}
          />
        </div>
      </div>
}

      <div className="flex flex-col gap-3 w-[100%]  dark:bg-neutral-800 absolute bottom-0">

{!pendingDelete && (
          <p
            color="neutral"
            className="hover:cursor-pointer w-4 hover:text-red-500 underline"
            onClick={() => setPendingDelete(true)}
          >
            Delete
          </p>
        )}

    
  {!pendingDelete && <Button color="primary" type="submit" onClick={handleSubmit}>
          Update
        </Button> }
        
      </div>
    </form>
  );
};

export default EditVideoForm;