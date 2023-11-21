import Input from "./Input";
import Button from "./Button";
import Label from "./Label";
import CheckboxList from "./CheckboxList";
import { Playlist, VideoUpdateProps, VideoUpdateType } from "../App";
 import { useContext, useEffect, useState } from "react";
import GlobalContext from "../contexts/GlobalContext";

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

  const rootURL = useContext(GlobalContext)?.rootURL

  const getPlaylists = async (video_id: number) => {
      //Returns an array of the video's playlists
      const response = await fetch(`${rootURL}/video/${video_id}/playlists`)
      const json = await response.json() as Playlist[]
     
      setVideoPlaylists(vps=> vps.map(vp=>({...vp, checked: json.some(p=>p.id === vp.playlist_id)})))
    }

  const handleTogglePlaylistVideo = async (
    playlistId: number,
    method: "POST" | "DELETE"
  ) => {
    try {
      const response = await fetch(`${rootURL}/playlist_videos`, {
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

    } catch (e) {
      if (e instanceof Error) {
        console.error(`Failed to fetch: ${e.message}`);
      }
    }
  };

  // On mount get the video's playlists
  useEffect(() => {getPlaylists(id).catch(e=>console.log(e))}, [id])

  const handleTitleChange = async (title: string) => {
    try {
      await fetch(`${rootURL}/videos/${id}`, {
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

  const handleDelete = async () => {
    try {
      const response = await fetch(`${rootURL}/videos/${id}`, {
        method: "DELETE", 
      })

      if (response.ok) {
        onSuccess(
          {
            type: VideoUpdateType.DELETE, 
            title, 
            id
          }
        );
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
            data-testid="cancel-video-delete"
            type="submit"
            color="neutral"
            onClick={(e: React.FormEvent) => { e.preventDefault(); setPendingDelete(false)}}
          >
            Cancel
          </Button>
          <Button
            data-testid="confirm-video-delete"
            type="submit"
            color="danger"
            onClick={(event: React.FormEvent) => {
              event.preventDefault();
              handleDelete().catch((e) => console.log(e));
            }}
          >
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
                event.preventDefault();
                handleTitleChange(event.target.value).catch((e) =>
                  console.log(e)
                );
                setName(event.target.value);
              }}
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
                onSelectionChange={(
                  playlist_id: number,
                  isChecked: boolean
                ) => {
                  handleTogglePlaylistVideo(
                    playlist_id,
                    isChecked ? "POST" : "DELETE"
                  ).catch((e) => console.log(e));
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 pt-5">
        {!pendingDelete && (
          <p
            data-testid="toggle-video-delete-warning"
            color="neutral"
            className="hover:cursor-pointer w-4 hover:text-red-500 underline"
            onClick={(e: React.FormEvent) => {e.preventDefault(); setPendingDelete(true)}}
          >
            Delete
          </p>
        )}
      </div>
    </form>
  );
};

export default EditVideoForm;