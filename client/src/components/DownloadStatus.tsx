import React, { useContext, useState } from 'react';
import { truncateString } from '../util';
import GlobalContext from '../contexts/GlobalContext';
import {  IoMdClose } from 'react-icons/io';
import { FaCheckCircle,  FaTimesCircle } from 'react-icons/fa';
import Spinner from './Spinner';

export interface iDownloadStatus {
  video_id: number;
  is_cancelled: boolean;
  is_complete: boolean;
  is_error: boolean;
  is_paused: boolean;
  title: string;
  url: string;
  progress: number;
  speed: string;
}

interface DownloadStatusProps {
  isDark: boolean;
  downloadStatuses: iDownloadStatus[];
}

async function onClickCancel(id: number, root_url: string | undefined) {
  const url = `${root_url}/downloads/${id}`;
  try {
      const response = await fetch(url, { method: 'DELETE' });
      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }
      console.log('Download cancellation successful');
  } catch (error) {
      console.log('An error occurred while cancelling the download:', error);
  }
}

async function resumeDownload(videoID: number, rootPath: string | undefined) {
  try {
    const response = await fetch(`${rootPath}/downloads/${videoID}`, {method: "PATCH"})
    if (!response.ok) {
      throw response 
    }
  } catch(e: any) {
      const r = e as Response
      if (r.body) {
          const body = await r.json(); // parse the body as JSON
          console.error(`Error resuming video: ${body}`) // use the parsed body in the error message
      } else {
          console.error(`Error resuming video: ${r.status} ${r.statusText}`)
      }
  } 
}

const DownloadStatus: React.FC<DownloadStatusProps> = ({ downloadStatuses, isDark }) => {
  const rootURL = useContext(GlobalContext)?.rootURL;
  const [hovered, setHovered] = useState(-1);
  console.log(downloadStatuses)
  return (
    <div className={`h-50 w-[340px] fixed top-10 right-4 z-20 m-4 ${isDark ? "bg-neutral-800 " : "bg-neutral-100"} shadow-lg rounded`}>
    {downloadStatuses.length === 0 && <p className="text-center">No recent downloads</p>}
    {downloadStatuses.map((d, index) => (
      <div onMouseLeave={ () => setHovered(-1) } onMouseOver={() => setHovered(index)} key={index} className={`${index === 0 && "rounded-t"} ${index === downloadStatuses.length-1 && "rounded-b"} ${ isDark ? "hover:bg-neutral-700" : "hover:bg-neutral-200"} p-3 px-4 flex items-center} ${d.is_cancelled && "opacity-50"} ${d.is_error && "opacity-40"} ${d.is_complete && "opacity-60"}`}>
        <p className="flex-1 text-md "> { truncateString(d.title, hovered === index ? 28 : 18) } </p>
        { 
          hovered !== index && d.progress < 98 && !d.is_complete && !d.is_paused && !d.is_cancelled && !d.is_error &&
          <div className="flex gap-1 ">
            <p> {d.progress}% </p><p className="opacity-25"> | </p> <p> {d.speed} </p>
          </div>
        }
        {
          <div className="flex">
            {/* TODO - clean up state logic */ }
            { hovered === index && d.progress < 98 && !d.is_complete && !d.is_cancelled && !d.is_paused && 
              <button
                className={`text-sm  flex h-full items-center ${"h-full rounded px-1 bg-red-400 text-black"}`}
                onClick={() => onClickCancel(d.video_id, rootURL)}
              >
                <IoMdClose className="text-red-500 font-bold" /> Cancel
              </button>
            }
            { d.is_paused && !d.is_cancelled && !d.is_error && !d.is_complete &&
            <div className="flex gap-1 ">
              <button
                className={`text-sm  flex h-full items-center ${"h-full rounded px-1 bg-blue-600 text-white"}`}
                onClick={() => resumeDownload(d.video_id, rootURL)}
              >
                Resume
              </button>
              <button
                className={`text-sm  flex h-full items-center ${"h-full rounded px-1 bg-red-500 text-white"}`}
                onClick={() => onClickCancel(d.video_id, rootURL)}
              >
                Cancel
              </button>
            </div>
            }

            { d.progress >= 98 && !d.is_error && !d.is_complete && !d.is_paused && !d.is_cancelled  && 
              <Spinner /> 
            }

            { d.is_cancelled && !d.is_error && 
              <span className="flex items-center gap-1"> cancelled </span>
            }

            { d.is_error && 
              <span className="flex items-center gap-1">
                <FaTimesCircle className="text-red-600" /> error{" "}
              </span>
            }

            { d.is_complete && !d.is_error && 
              <span className="flex items-center gap-1">
                <FaCheckCircle className="text-green-500 text-sm" /> done
              </span>
            }
          </div>
          }
        </div>
     ))}
   </div>
 );
};

export default DownloadStatus;