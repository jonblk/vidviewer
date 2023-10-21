import Input from "./Input";
import Button from "./Button";
import Label from "./Label";
import CheckboxList from "./CheckboxList";
import { Playlist, VideoUpdateProps, VideoUpdateType } from "../App";
 import { useEffect, useState } from "react";

interface FormComponentProps {
  onSuccess: (v: VideoUpdateProps) =>  void
  id: number
  initialTitle: string
  allPlaylists: Playlist[]
}

type VideoPlaylist = {
  playlist_id: number,
  checked: boolean,
  name: string
}

const EditVideoForm: React.FC<FormComponentProps> = ({allPlaylists, onSuccess, id, initialTitle }) => {
  const [title, setName] = useState(initialTitle);
  const [videoPlaylists, setVideoPlaylists] = useState<VideoPlaylist[]>(allPlaylists.map(p=>({playlist_id: p.id, name: p.name, checked: false})));
  const [pendingDelete, setPendingDelete] = useState(false);

  const getPlaylists = async (video_id: number) => {
      //Returns an array of the video's playlists
      const response = await fetch(`https://localhost:8000/video/${video_id}/playlists`)
      const json = await response.json() as Playlist[]
     
      setVideoPlaylists(vps=> vps.map(vp=>({...vp, checked: json.some(p=>p.id === vp.playlist_id)})))
    }

  const handleTogglePlaylistVideo = async (
    playlistId: number,
    method: "POST" | "DELETE"
  ) => {
    try {
      const response = await fetch(`https://localhost:8000/playlist_videos`, {
        headers: { "Content-Type": "application/json" },
        method,
        body: JSON.stringify({ playlist_id: playlistId.toString(), video_id: id.toString() }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      onSuccess({
        type: method === "POST" ? VideoUpdateType.ADD_TO_PLAYLIST : VideoUpdateType.REMOVE_FROM_PLAYLIST, 
        title, 
        id
      });
      
      getPlaylists(id).catch(e=>console.log(e))

      // You may want to return data here, depending on your use case
    } catch (error) {
      console.error(`Failed to fetch: ${error}`);
    }
  };

  // On mount get the video's playlists
  useEffect(() => {getPlaylists(id).catch(e=>console.log(e))}, [id])

  const handleTitleChange = async (title: string) => {
    try {
      await fetch(`https://localhost:8000/videos/${id}`, {
        headers: {
          "Content-Type": "application/json", // or "multipart/form-data"
        },
        method: "PUT",
        body: JSON.stringify({ title }),
      })
      onSuccess({type: VideoUpdateType.UPDATE_PROPERTY, title, id})
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
        onSuccess({type: VideoUpdateType.DELETE, title, id}).catch(e=>console.log(e));
      } else {
        console.log("Error editing video")
      }
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <form className="relative ">
      {pendingDelete && (
        <div className="flex flex-col gap-3">
          Delete this video?
          <p className="text-neutral-400">"{title}"</p>
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
      {!pendingDelete && (
        <div className="flex flex-col gap-3 overflow-auto h-[90%]">
          <div>
            <Label htmlFor="title">Video title</Label>
            <Input
              label="title"
              type="text"
              id="title"
              value={title ? title : ""}
              onChange={(event) => {
                event.preventDefault()
                handleTitleChange(event.target.value).catch(e=>console.log(e))
                setName(event.target.value)
              }
              }
            />
          </div>

          <div>
            <Label htmlFor="Playlists">Playlists</Label>
            <div className="h-[140px] overflow-auto">
              <CheckboxList<number>
                options={videoPlaylists.map((p) => {
                  return {
                    label: p.name,
                    value: p.playlist_id,
                    checked: p.checked,
                  };
                })}
                onSelectionChange={(playlist_id: number, isChecked: boolean) => {
                  handleTogglePlaylistVideo(playlist_id, isChecked ? "POST" : "DELETE").catch(e => console.log(e))
                }}
              />
            </div>
          </div>
        </div>
      )}

<div className="flex flex-col gap-2 pt-5">
      {!pendingDelete && (
        <p
          color="neutral"
          className="hover:cursor-pointer w-4 hover:text-red-500 underline"
          onClick={() => setPendingDelete(true)}
        >
          Delete
        </p>
      )}
      </div>
    </form>
  );
};

export default EditVideoForm;