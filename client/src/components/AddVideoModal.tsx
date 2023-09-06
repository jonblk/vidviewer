import { useCallback, useState } from "react";
import Dropdown, { Option } from "./Dropdown";
import { Playlist } from "../App";
import Button from "./Button";
import Spinner from "./Spinner";
import Label from "./Label";
import useDebounce from "../hooks/useDebounce";
import { isValidUrl } from "../util";
import Input from "./Input";

interface AddVideoModalProps {
    playlists: Playlist[];
    onSuccess: () => void; 
}

interface FormData {
  source: "disk" | "ytdlp";
  playlist_id: number;
  folder: string | null;
  url: string | null
}

type VideoFormat = {
  format_id: string;
  resolution: string;
  ext: string;
}

export default function AddVideoModal({
  playlists,
  onSuccess,
}: AddVideoModalProps) {
  const [type, setType] = useState<Option>({ value: 0, label: "🔗 URL" });

  // State for yt-dlp form
  const [url, setUrl] = useState("");
  const [selectedPlaylist, setSelectedPlaylist] = useState<number | null>(null);
  const [selectedVideoFormat, setSelectedVideoFormat] = useState<VideoFormat>();
  const [videoFormats, setVideoFormats] = useState<VideoFormat[]>([]);
  const [isFetchingVideoFormats, setIsFetchingVideoFormats] = useState(false);
  const [folder, setFolder] = useState("");

  const [isFetchingSubmit, setIsFetchingSubmit] = useState(false);

  const handlePlaylistChange = (option: Option) => {
    setSelectedPlaylist(+option.value);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const fetchVideoFormats = async (url: string) => {
    try {
      setIsFetchingVideoFormats(true);
      const r = await fetch(
        `https://localhost:8000/video_formats?url=${encodeURIComponent(url)}`
      );
      let v: VideoFormat[] = (await r.json()) as VideoFormat[];
      v.reverse();

      // remove duplicate resolutions
      // NOTE - temporary fix
      v = v.reduce((accumulator: VideoFormat[], current: VideoFormat) => {
        const resolutionExists = accumulator.some(
          (item: VideoFormat) => item.resolution === current.resolution
        );
        if (!resolutionExists) {
          accumulator.push(current);
        }
        return accumulator;
      }, []);

      setVideoFormats(v);
      setSelectedVideoFormat(v[0]);
    } catch (e) {
      console.log(e);
    } finally {
      setIsFetchingVideoFormats(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<Element>) => {
    e.preventDefault();

    if (selectedPlaylist !== null) {
      const data: FormData = {
        source: type.value === 1 ? "disk" : "ytdlp",
        playlist_id: selectedPlaylist,
        folder,
        url
      } 

      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      };

      setIsFetchingSubmit(true);

      fetch("https://localhost:8000/videos", requestOptions)
        .then((response) => {
          if (response.status === 200) {
            setIsFetchingSubmit(false);
            onSuccess();
          } else {
            alert(response.statusText);
          }
        })
        .catch((error) => {
          console.error("Error sending the POST request:", error);
          setIsFetchingSubmit(false);
        });
    }
  };

  // Fetch video formats on url changes
  useDebounce<string>(
    url,
    useCallback((u: string) => {
      isValidUrl(u) ? fetchVideoFormats(u).catch((e) => console.log(e)) : null;
    }, []),
    1000
  );

  return (
    <div className="flex flex-col gap-3">
      <div>
      <Label htmlFor="url">Source</Label>
      <Dropdown
        selected={type}
        onSelect={(o: Option) => setType(o)}
        isFetching={false}
        disabled={false}
        options={[
          { value: 0, label: "🔗 URL" },
          { value: 1, label: "📂 Disk" },
        ]}
      /></div>

      {type.value === 0 && 
      <div className="flex flex-col gap-2">
       <div>
        <Label htmlFor="url">URL</Label>
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
          Resolution
        </Label>
        <Dropdown
          selected={selectedVideoFormat ? {value: selectedVideoFormat.format_id, label: selectedVideoFormat.resolution} : undefined}
          isFetching={isFetchingVideoFormats}
          disabled={videoFormats.length === 0}
          options={videoFormats.map(p=>{return{label:p.resolution, value: p.format_id}})}
          onSelect={(o: Option) => {setSelectedVideoFormat(videoFormats.find(vf=> vf.format_id ===o.value))}}
        />
      </div> 
      </div>}

      {type.value === 1 && <div>
        <Label htmlFor="Folder Path">Folder Path  <span className="text-xs text-neutral-400">(.mp4, .webm)</span></Label>
        
        <Input onChange={v=>setFolder(v.target.value)} type="input" id="Folder Path" label="Folder Path" value={folder} />
    </div> 
      }

      <div>
        <Label htmlFor="playlist">Playlist</Label>
        <Dropdown
          disabled={false}
          isFetching={false}
          options={playlists
            .filter((p) => p.id !== 0)
            .map((p) => {
              return { label: p.name, value: p.id };
            })}
          onSelect={handlePlaylistChange}
        />
      </div>

      {/* Submit button*/}
      <Button
        onClick={handleSubmit}
        color="primary"
        disabled={isFetchingSubmit}
        type="submit"
      >
        {isFetchingSubmit ? <Spinner /> : type.value === 0 ? "Download Video" : "Import Videos"}
      </Button>
    </div>
  );
}