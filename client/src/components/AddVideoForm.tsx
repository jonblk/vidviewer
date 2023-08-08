import React, { useCallback, useState } from "react";
import { Playlist } from "./../App";
import Label from "./Label";
import Input from "./Input";
import Button from "./Button";
import Dropdown, { Option } from "./Dropdown";
import Spinner from "./Spinner";
import useDebounce from "../hooks/useDebounce";
import { isValidUrl } from "../util";

interface AddVideoFormProps {
  playlists: Playlist[];
  onSuccess: () => void
}

type VideoFormat = {
  format_id: string;
  resolution: string;
  ext: string;
}

const AddVideoForm: React.FC<AddVideoFormProps> = ({ playlists, onSuccess }) => {
  const [url, setUrl] = useState("");
  const [selectedPlaylist, setSelectedPlaylist] = useState<number | null>(null);
  const [selectedVideoFormat, setSelectedVideoFormat] = useState<VideoFormat>();
  const [isLoading, setIsLoading] = useState(false);
  const [videoFormats, setVideoFormats] = useState<VideoFormat[]>([]);
  const [isFetchingVideoFormats, setIsFetchingVideoFormats] = useState(false)

  const handleFocus = () => {
    // Clear the input field when it receives focus
    setUrl("");
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handlePlaylistChange = (option: Option) => {
    setSelectedPlaylist(+option.value);
  };

  const fetchVideoFormats = async (url: string) => {
    try {
      setIsFetchingVideoFormats(true)
      const r = await fetch(`http://localhost:8000/video_formats?url=${encodeURIComponent(url)}`);
      let v: VideoFormat[] = await r.json() as VideoFormat[];
      v.reverse()

      // remove duplicate resolutions 
      // NOTE - temporary fix
      v = v.reduce((accumulator, current) => {
        const resolutionExists = accumulator.some(
          (item: VideoFormat) => item.resolution === current.resolution
        );
        if (!resolutionExists) {
          accumulator.push(current);
        }
        return accumulator;
      }, []);

      setVideoFormats(v);
      setSelectedVideoFormat(v[0])
    } catch(e) {
      console.log(e);
    } finally {
      setIsFetchingVideoFormats(false)
    }
  }

  const handleSubmit = (e: React.FormEvent<Element>) => {
    e.preventDefault();

    if (selectedPlaylist !== null) {
      //const formData = { url, playlistId: selectedPlaylist };
      const formData = new URLSearchParams();
      formData.append("url", url);
      formData.append("playlistId", String(selectedPlaylist));
      formData.append("video_format", String(selectedVideoFormat?.format_id));

      const requestOptions: RequestInit = {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded"},
        body: formData.toString(),
      };

      setIsLoading(true);

      fetch("http://localhost:8000/videos", requestOptions)
        .then((response) => {
          if (response.status === 200) {
            setIsLoading(false);
            onSuccess();
          } else {
            console.error(response.statusText);
          }
        })
        .catch((error) => {
          console.error("Error sending the POST request:", error);
          setIsLoading(false);
        });
        
    }
  };

  // Fetch video formats on url changes
  useDebounce<string>(
    url,
    useCallback((u: string) => {isValidUrl(u) ? fetchVideoFormats(u).catch(e=> console.log(e)) : null},[]),
    1000,
  )

  return (
    <form className={"flex flex-col gap-2.5"} onSubmit={handleSubmit}>
      <div>
        <Label htmlFor="url">URL:</Label>
        <Input 
          label="Enter url for video"
          type="text" 
          id="url" 
          value={url} 
          onChange={handleUrlChange} 
        />
      </div>
      <div>
        <Label htmlFor="video_format">
          Resolution:
        </Label>
        <Dropdown
          selected={selectedVideoFormat ? {value: selectedVideoFormat.format_id, label: selectedVideoFormat.resolution} : undefined}
          isFetching={isFetchingVideoFormats}
          disabled={videoFormats.length === 0}
          options={videoFormats.map(p=>{return{label:p.resolution, value: p.format_id}})}
          onSelect={(o: Option) => {setSelectedVideoFormat(videoFormats.find(vf=> vf.format_id ===o.value))}}
        />
      </div>
      <div>
        <Label htmlFor="playlist">Playlist:</Label>
        <Dropdown
          disabled={false}
          isFetching={false}
          options={playlists.map(p=>{return{label:p.name, value: p.id}})}
          onSelect={handlePlaylistChange}
        />
      </div>
      <div></div>
      <Button onClick={handleSubmit} color="primary" disabled={isLoading} type="submit">
        {isLoading ? <Spinner /> : 'Add Video'}
      </Button>
    </form>
  );
};

export default AddVideoForm;